import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  createDao,
  listDaos,
  listCommunityRecords,
  updateDao,
  upsertCommunityRecord,
  upsertProposalByDaoProposalId,
  upsertSnapshotArtifact
} from "./db";

const execFileAsync = promisify(execFile);
const molochRoot = path.join(process.cwd(), "workspace", "skills", "moloch");
const molochScript = path.join(molochRoot, "moloch-shared", "scripts", "moloch.mjs");

type SyncInput = {
  daoId?: number;
  daoAddress?: string;
  name?: string;
  outDir?: string;
  first?: number;
};

type JsonRecord = Record<string, unknown>;

export async function syncDao(input: SyncInput) {
  const dao = ensureDao(input);
  if (!dao.daoAddress) {
    throw new Error("DAO address is required before sync");
  }

  const outDir = input.outDir || path.join("workspace", "runtime", "moloch-artifacts", dao.daoAddress.toLowerCase());
  const snapshot = await runMoloch("task-snapshot", [
    "--dao",
    dao.daoAddress,
    "--first",
    String(input.first || 100),
    "--out-dir",
    outDir
  ]);

  const files = snapshot.files as JsonRecord | undefined;
  const summary = snapshot.summary as JsonRecord | undefined;

  const artifact = upsertSnapshotArtifact({
    daoId: dao.id,
    artifactDir: String(snapshot.outDir || outDir),
    checkpointPath: stringField(files, "checkpoint"),
    operatingContextPath: stringField(files, "operatingContext"),
    proposalSummaryPath: stringField(files, "proposalSummary"),
    processQueuePath: stringField(files, "processQueue"),
    directStatePath: stringField(files, "directState"),
    lastGraphProposalIdSeen: await lastGraphProposalId(stringField(files, "checkpoint")),
    votingCount: numberField(summary, "votingCount"),
    needsProcessingCount: numberField(summary, "needsProcessingCount"),
    pendingActionCount: numberField(summary, "needsProcessingCount"),
    status: "fresh"
  });

  const operatingContext = await readJsonFile(stringField(files, "operatingContext"));
  const proposalSummary = await readJsonFile(stringField(files, "proposalSummary"));
  const daoRecords = await readJsonFile(stringField(files, "daoRecords"));

  const updatedDao = ingestOperatingContext(dao.id, operatingContext);
  const proposals = ingestProposalSummary(dao.id, proposalSummary);
  const records = ingestDaoRecords(dao.id, daoRecords);

  return {
    dao: updatedDao,
    artifact,
    proposals,
    records,
    snapshot
  };
}

export async function syncArtifacts(input: SyncInput) {
  return syncDao(input);
}

export async function syncMemory(input: SyncInput & { table?: string }) {
  const dao = ensureDao(input);
  if (!dao.daoAddress) {
    throw new Error("DAO address is required before memory sync");
  }

  const table = input.table || "communityMemory";
  const result = await runMoloch("graph-records", ["--dao", dao.daoAddress, "--table", table]);
  const records = Array.isArray(result.records) ? result.records : [];
  const cached = records.map((record) => ingestGraphRecord(dao.id, table, record as JsonRecord)).filter(Boolean);

  return {
    dao,
    table,
    records: cached,
    sourceCount: records.length
  };
}

export async function getSharedMemoryState(daoId?: number) {
  const daos = typeof daoId === "number" ? listDaos().filter((dao) => dao.id === daoId) : listDaos();
  const results = await Promise.all(daos.map(async (dao) => {
    const sharedState = await fetchIpfsJsonOrText(dao.sharedStateUri);
    const communityMemory = await fetchIpfsJsonOrText(dao.communityMemoryUri);
    return {
      dao,
      sharedState,
      communityMemory,
      records: listCommunityRecords(dao.id)
    };
  }));
  return results;
}

async function runMoloch(command: string, args: string[]) {
  const { stdout } = await execFileAsync("node", [molochScript, command, ...args], {
    cwd: molochRoot,
    env: process.env,
    maxBuffer: 1024 * 1024 * 20
  });
  return JSON.parse(stdout) as JsonRecord;
}

function ensureDao(input: SyncInput) {
  const daoId = Number(input.daoId);
  if (Number.isInteger(daoId) && daoId > 0) {
    const dao = listDaos().find((item) => item.id === daoId);
    if (!dao) throw new Error("DAO not found");
    return dao;
  }

  const address = input.daoAddress?.trim();
  if (!address) {
    throw new Error("daoId or daoAddress is required");
  }

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

function ingestOperatingContext(daoId: number, context: unknown) {
  const data = asRecord(context);
  const profile = asRecord(data.currentProfile);
  const charter = asRecord(data.currentCharter);
  const description = stringField(profile, "description") || stringField(profile, "longDescription");
  const charterText = stringField(charter, "body") || stringField(charter, "description") || stringField(charter, "title");

  return updateDao(daoId, {
    name: stringField(profile, "name") || undefined,
    communityMemoryUri: stringField(profile, "communityMemoryURI") || undefined,
    proposalWorkspaceUri: stringField(profile, "proposalWorkspaceURI") || undefined,
    sharedStateUri: stringField(profile, "sharedStateURI") || undefined,
    thesis: description || undefined,
    charter: charterText || undefined
  });
}

function ingestProposalSummary(daoId: number, summary: unknown) {
  const data = asRecord(summary);
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((item) => {
    const proposal = asRecord(item);
    const lifecycle = asRecord(proposal.lifecycle);
    const proposalId = String(proposal.proposalId || "");
    if (!proposalId) return null;
    return upsertProposalByDaoProposalId({
      daoId,
      proposalId,
      title: String(proposal.title || `Proposal ${proposalId}`),
      proposalType: String(proposal.proposalType || "SIGNAL"),
      status: mapProposalStatus(String(lifecycle.status || "")),
      summary: String(lifecycle.status || ""),
      agentStance: "watch",
      confidence: "medium",
      recommendedVote: "defer",
      rationale: "Synced from moloch-skills task-snapshot. Review mandate and live preflight before action."
    });
  }).filter(Boolean);
}

function ingestDaoRecords(daoId: number, records: unknown) {
  const data = asRecord(records);
  return Object.entries(data).flatMap(([table, value]) => {
    const items = Array.isArray(value) ? value : [];
    return items.map((record) => ingestGraphRecord(daoId, table, asRecord(record))).filter(Boolean);
  });
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

async function readJsonFile(file: string) {
  if (!file) return null;
  try {
    return JSON.parse(await fs.readFile(path.resolve(process.cwd(), file), "utf8"));
  } catch {
    return null;
  }
}

async function lastGraphProposalId(checkpointPath: string) {
  const checkpoint = asRecord(await readJsonFile(checkpointPath));
  return numberField(checkpoint, "lastGraphProposalIdSeen");
}

async function fetchIpfsJsonOrText(uri: string) {
  if (!uri || !process.env.PINATA_GATEWAY_URL) return null;
  const url = ipfsToGatewayUrl(uri, process.env.PINATA_GATEWAY_URL);
  if (!url) return null;

  const response = await fetch(url, {
    headers: process.env.PINATA_JWT ? { Authorization: `Bearer ${process.env.PINATA_JWT}` } : undefined,
    cache: "no-store"
  });
  if (!response.ok) return { uri, ok: false, status: response.status };

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return { uri, ok: true, content: await response.json() };
  }
  return { uri, ok: true, content: await response.text() };
}

function ipfsToGatewayUrl(uri: string, gateway: string) {
  const cleanGateway = gateway.replace(/\/$/, "");
  if (uri.startsWith("ipfs://")) return `${cleanGateway}/ipfs/${uri.slice(7)}`;
  if (/^https?:\/\//.test(uri)) return uri;
  if (uri.startsWith("bafy") || uri.startsWith("Qm")) return `${cleanGateway}/ipfs/${uri}`;
  return "";
}

function mapProposalStatus(status: string) {
  if (status.includes("voting")) return "voting";
  if (status.includes("grace")) return "grace";
  if (status.includes("ready") || status.includes("process")) return "ready";
  if (status.includes("processed")) return "processed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("draft")) return "draft";
  return "submitted";
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

function numberField(record: JsonRecord | undefined, key: string) {
  const value = Number(record?.[key]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function unixOrStringDate(value: unknown) {
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  if (typeof value === "string" && /^\d+$/.test(value)) return new Date(Number(value) * 1000).toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}
