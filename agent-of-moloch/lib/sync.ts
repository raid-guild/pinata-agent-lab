import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import {
  createDao,
  listCommunityRecords,
  listDaos,
  updateDao,
  upsertCommunityRecord,
  upsertProposalByDaoProposalId,
  upsertSnapshotArtifact
} from "./db";

const execFileAsync = promisify(execFile);
const molochAgentBin = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "moloch-agent.cmd" : "moloch-agent");

type SyncInput = {
  daoId?: number;
  daoAddress?: string;
  name?: string;
  first?: number;
};

type JsonRecord = Record<string, unknown>;

export async function syncDao(input: SyncInput) {
  const dao = ensureDao(input);
  if (!dao.daoAddress) throw new Error("DAO address is required before sync");

  const first = input.first || 100;
  const [daoResult, directDaoResult, proposalsResult, processQueueResult, profileRecordsResult, memoryRecordsResult] = await Promise.all([
    runMolochAgentSafe("dao", ["--dao", dao.daoAddress]),
    runMolochAgentSafe("read-dao", ["--dao", dao.daoAddress]),
    runMolochAgentSafe("proposals", ["--dao", dao.daoAddress, "--first", String(first)]),
    runMolochAgentSafe("process-queue", ["--dao", dao.daoAddress, "--first", String(first)]),
    runMolochAgentSafe("records", ["--dao", dao.daoAddress, "--table", "daoProfile", "--first", "20"]),
    runMolochAgentSafe("records", ["--dao", dao.daoAddress, "--table", "communityMemory", "--first", "50"])
  ]);

  if (!daoResult.ok && !directDaoResult.ok) {
    throw new Error(`Unable to sync DAO. Graph read failed: ${daoResult.error}. Direct RPC read failed: ${directDaoResult.error}`);
  }

  const proposals = proposalsResult.ok ? extractArray(proposalsResult.data, "proposals") : [];
  const processQueue = processQueueResult.ok ? extractArray(processQueueResult.data, "queue") : [];
  const profileRecords = profileRecordsResult.ok ? extractArray(profileRecordsResult.data, "records") : [];
  const memoryRecords = memoryRecordsResult.ok ? extractArray(memoryRecordsResult.data, "records") : [];
  const errors = [daoResult, directDaoResult, proposalsResult, processQueueResult, profileRecordsResult, memoryRecordsResult]
    .filter((result) => !result.ok)
    .map((result) => ({ command: result.command, error: result.error }));

  const artifact = upsertSnapshotArtifact({
    daoId: dao.id,
    artifactDir: `moloch-service:${process.env.MOLOCH_SERVICE_URL || "default"}`,
    checkpointPath: "service:dao/proposals/process-queue",
    operatingContextPath: "service:dao/records/daoProfile",
    proposalSummaryPath: "service:dao/proposals",
    processQueuePath: "service:dao/process-queue",
    directStatePath: directDaoResult.ok ? "rpc:read-dao" : "",
    lastGraphProposalIdSeen: proposals.reduce((max, proposal) => Math.max(max, Number(proposal.proposalId || 0)), 0),
    votingCount: proposals.filter((proposal) => mapProposalStatusFromProposal(proposal) === "voting").length,
    needsProcessingCount: processQueue.length,
    pendingActionCount: processQueue.length,
    status: errors.length ? "manual" : "fresh"
  });

  const updatedDao = ingestDaoProfile(dao.id, daoResult.ok ? daoResult.data : directDaoResult.data, profileRecords);
  const cachedProposals = ingestProposals(dao.id, proposals);
  const cachedProfileRecords = profileRecords.map((record) => ingestGraphRecord(dao.id, "daoProfile", record)).filter(Boolean);
  const cachedMemoryRecords = memoryRecords.map((record) => ingestGraphRecord(dao.id, "communityMemory", record)).filter(Boolean);

  return {
    dao: updatedDao,
    artifact,
    proposals: cachedProposals,
    records: [...cachedProfileRecords, ...cachedMemoryRecords],
    service: {
      dao: daoResult.ok ? daoResult.data : null,
      directDao: directDaoResult.ok ? directDaoResult.data : null,
      processQueue: processQueueResult.ok ? processQueueResult.data : null,
      errors
    },
    partial: errors.length > 0
  };
}

export async function syncArtifacts(input: SyncInput) {
  return syncDao(input);
}

export async function syncMemory(input: SyncInput & { table?: string }) {
  const dao = ensureDao(input);
  if (!dao.daoAddress) throw new Error("DAO address is required before memory sync");

  const table = input.table || "communityMemory";
  const result = await runMolochAgent("records", ["--dao", dao.daoAddress, "--table", table, "--first", String(input.first || 100)]);
  const records = extractArray(result, "records");
  const cached = records.map((record) => ingestGraphRecord(dao.id, table, record)).filter(Boolean);

  return {
    dao,
    table,
    records: cached,
    sourceCount: records.length
  };
}

export async function getSharedMemoryState(daoId?: number) {
  const daos = typeof daoId === "number" ? listDaos().filter((dao) => dao.id === daoId) : listDaos();
  return Promise.all(daos.map(async (dao) => ({
    dao,
    sharedState: await fetchIpfsJsonOrText(dao.sharedStateUri),
    communityMemory: await fetchIpfsJsonOrText(dao.communityMemoryUri),
    records: listCommunityRecords(dao.id)
  })));
}

async function runMolochAgent(command: string, args: string[]) {
  const { stdout } = await execFileAsync(molochAgentBin, [command, ...args], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 1024 * 20
  });
  return JSON.parse(stdout) as JsonRecord;
}

async function runMolochAgentSafe(command: string, args: string[]) {
  try {
    return {
      ok: true as const,
      command,
      data: await runMolochAgent(command, args)
    };
  } catch (error) {
    return {
      ok: false as const,
      command,
      error: error instanceof Error ? error.message : "unknown moloch-agent error",
      data: {}
    };
  }
}

function ensureDao(input: SyncInput) {
  const daoId = Number(input.daoId);
  if (Number.isInteger(daoId) && daoId > 0) {
    const dao = listDaos().find((item) => item.id === daoId);
    if (!dao) throw new Error("DAO not found");
    return dao;
  }

  const address = input.daoAddress?.trim();
  if (!address) throw new Error("daoId or daoAddress is required");

  const existing = listDaos().find((item) => item.daoAddress.toLowerCase() === address.toLowerCase());
  if (existing) return existing;

  const created = createDao({
    name: input.name || `DAO ${address.slice(0, 6)}...${address.slice(-4)}`,
    daoAddress: address,
    chainId: "8453",
    daohausUrl: `https://admin.daohaus.club/molochv3/0x2105/${address}`,
    status: "active"
  });
  if (!created) throw new Error("Unable to create DAO record");
  return created;
}

function ingestDaoProfile(daoId: number, daoResult: unknown, records: JsonRecord[]) {
  const indexedDao = asRecord(asRecord(daoResult).dao);
  const latestProfile = latestContent(records);
  const description = stringField(latestProfile, "description") || stringField(latestProfile, "longDescription");

  return updateDao(daoId, {
    name: stringField(latestProfile, "name") || stringField(indexedDao, "name") || undefined,
    communityMemoryUri: stringField(latestProfile, "communityMemoryURI") || undefined,
    proposalWorkspaceUri: stringField(latestProfile, "proposalWorkspaceURI") || undefined,
    sharedStateUri: stringField(latestProfile, "sharedStateURI") || undefined,
    thesis: description || undefined,
    votingPower: stringField(indexedDao, "totalShares") || undefined
  });
}

function ingestProposals(daoId: number, proposals: JsonRecord[]) {
  return proposals.map((proposal) => {
    const proposalId = String(proposal.proposalId || "");
    if (!proposalId) return null;
    return upsertProposalByDaoProposalId({
      daoId,
      proposalId,
      title: String(proposal.title || `Proposal ${proposalId}`),
      proposalType: String(proposal.proposalType || "SIGNAL"),
      status: mapProposalStatusFromProposal(proposal),
      summary: String(proposal.description || proposal.contentURI || ""),
      agentStance: "watch",
      confidence: "medium",
      recommendedVote: "defer",
      rationale: "Synced from @raidguild/meta-clawtel through moloch-service. Review mandate and live preflight before action."
    });
  }).filter(Boolean);
}

function ingestGraphRecord(daoId: number, tableName: string, record: JsonRecord) {
  const rawContent = String(record.content || "");
  const content = parseJson(rawContent);
  const contentRecord = asRecord(content);
  const recordId = String(record.id || contentRecord.id || `${tableName}:${record.createdAt || Date.now()}`);
  return upsertCommunityRecord({
    daoId,
    tableName,
    recordId,
    content: rawContent,
    contentJson: typeof content === "string" ? "" : JSON.stringify(content),
    contentUri: stringField(contentRecord, "contentURI") || stringField(contentRecord, "uri") || stringField(record, "contentURI"),
    threadId: stringField(contentRecord, "threadId"),
    topicId: stringField(contentRecord, "topicId"),
    proposalId: stringField(contentRecord, "proposalId"),
    recordType: stringField(contentRecord, "type"),
    createdAt: unixOrStringDate(record.createdAt)
  });
}

async function fetchIpfsJsonOrText(uri: string) {
  const gateway = process.env.IPFS_GATEWAY_URL || process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
  if (!uri) return null;
  const url = ipfsToGatewayUrl(uri, gateway);
  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return { uri, ok: false, status: response.status };

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json")) return { uri, ok: true, content: await response.json() };
  return { uri, ok: true, content: await response.text() };
}

function ipfsToGatewayUrl(uri: string, gateway: string) {
  const cleanGateway = gateway.replace(/\/$/, "");
  const gatewayBase = cleanGateway.endsWith("/ipfs") ? cleanGateway : `${cleanGateway}/ipfs`;
  if (uri.startsWith("ipfs://")) return `${gatewayBase}/${uri.slice(7)}`;
  if (/^https?:\/\//.test(uri)) return uri;
  if (uri.startsWith("bafy") || uri.startsWith("Qm")) return `${gatewayBase}/${uri}`;
  return "";
}

function mapProposalStatusFromProposal(proposal: JsonRecord) {
  const now = Math.floor(Date.now() / 1000);
  if (Boolean(proposal.cancelled)) return "cancelled";
  if (Boolean(proposal.processed)) return "processed";
  if (!Boolean(proposal.sponsored)) return "submitted";
  const votingStarts = Number(proposal.votingStarts || 0);
  const votingEnds = Number(proposal.votingEnds || 0);
  const graceEnds = Number(proposal.graceEnds || 0);
  if (votingStarts < now && votingEnds > now) return "voting";
  if (votingEnds < now && graceEnds > now) return "grace";
  if (graceEnds < now) return "ready";
  return "submitted";
}

function latestContent(records: JsonRecord[]) {
  const latest = records[0];
  if (!latest) return {};
  return asRecord(parseJson(String(latest.content || "")));
}

function extractArray(record: JsonRecord, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringField(record: JsonRecord | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function unixOrStringDate(value: unknown) {
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  if (typeof value === "string" && /^\d+$/.test(value)) return new Date(Number(value) * 1000).toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}
