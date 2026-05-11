import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Dao = {
  id: number;
  name: string;
  daoAddress: string;
  chainId: string;
  daohausUrl: string;
  communityMemoryUri: string;
  proposalWorkspaceUri: string;
  sharedStateUri: string;
  charter: string;
  thesis: string;
  conviction: string;
  platform: string;
  votingPower: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Proposal = {
  id: number;
  daoId: number;
  daoName: string;
  daoAddress: string;
  proposalId: string;
  title: string;
  summary: string;
  proposalType: string;
  status: string;
  agentStance: string;
  confidence: string;
  recommendedVote: string;
  rationale: string;
  dueDate: string;
  txHash: string;
  contentUri: string;
  contentUriType: string;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceTask = {
  id: number;
  daoId: number | null;
  daoName: string | null;
  proposalRecordId: number | null;
  proposalTitle: string | null;
  title: string;
  body: string;
  actionType: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type SnapshotArtifact = {
  id: number;
  daoId: number;
  daoName: string;
  daoAddress: string;
  artifactDir: string;
  checkpointPath: string;
  operatingContextPath: string;
  proposalSummaryPath: string;
  processQueuePath: string;
  directStatePath: string;
  updatedAt: string;
  lastGraphProposalIdSeen: number;
  lastPassedProposalIdIncorporated: string;
  votingCount: number;
  needsProcessingCount: number;
  pendingActionCount: number;
  status: string;
  createdAt: string;
};

export type CommunityRecord = {
  id: number;
  daoId: number;
  daoName: string;
  daoAddress: string;
  tableName: string;
  recordId: string;
  content: string;
  contentJson: string;
  contentUri: string;
  threadId: string;
  topicId: string;
  proposalId: string;
  recordType: string;
  createdAt: string;
  updatedAt: string;
};

type DaoInput = Partial<Pick<Dao, "name" | "daoAddress" | "chainId" | "daohausUrl" | "communityMemoryUri" | "proposalWorkspaceUri" | "sharedStateUri" | "charter" | "thesis" | "conviction" | "platform" | "votingPower" | "status">>;
type ProposalInput = Partial<Pick<Proposal, "daoId" | "proposalId" | "title" | "summary" | "proposalType" | "status" | "agentStance" | "confidence" | "recommendedVote" | "rationale" | "dueDate" | "txHash" | "contentUri" | "contentUriType">>;
type TaskInput = Partial<Pick<GovernanceTask, "daoId" | "proposalRecordId" | "title" | "body" | "actionType" | "status" | "priority" | "dueDate">>;
type SnapshotInput = Partial<Pick<SnapshotArtifact, "daoId" | "artifactDir" | "checkpointPath" | "operatingContextPath" | "proposalSummaryPath" | "processQueuePath" | "directStatePath" | "lastGraphProposalIdSeen" | "lastPassedProposalIdIncorporated" | "votingCount" | "needsProcessingCount" | "pendingActionCount" | "status">>;
type CommunityRecordInput = Partial<Pick<CommunityRecord, "daoId" | "tableName" | "recordId" | "content" | "contentJson" | "contentUri" | "threadId" | "topicId" | "proposalId" | "recordType" | "createdAt">>;

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "agent-of-moloch.sqlite");
const daoStatuses = new Set(["active", "watching", "paused"]);
const proposalStatuses = new Set(["draft", "submitted", "voting", "grace", "ready", "processed", "cancelled"]);
const stances = new Set(["support", "oppose", "abstain", "watch"]);
const votes = new Set(["yes", "no", "abstain", "defer"]);
const taskStatuses = new Set(["open", "doing", "done"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const actionTypes = new Set(["read-dao", "check-proposal", "vote", "sponsor", "process", "record"]);
const artifactStatuses = new Set(["fresh", "stale", "missing", "manual"]);

let db: Database.Database | undefined;

export function getDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    migrate(db);
    seed(db);
  }

  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS daos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dao_address TEXT NOT NULL DEFAULT '',
      chain_id TEXT NOT NULL DEFAULT '8453',
      daohaus_url TEXT NOT NULL DEFAULT '',
      community_memory_uri TEXT NOT NULL DEFAULT '',
      proposal_workspace_uri TEXT NOT NULL DEFAULT '',
      shared_state_uri TEXT NOT NULL DEFAULT '',
      charter TEXT NOT NULL DEFAULT '',
      thesis TEXT NOT NULL DEFAULT '',
      conviction TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT '',
      voting_power TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dao_id INTEGER NOT NULL,
      proposal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      proposal_type TEXT NOT NULL DEFAULT 'SIGNAL',
      status TEXT NOT NULL DEFAULT 'submitted',
      agent_stance TEXT NOT NULL DEFAULT 'watch',
      confidence TEXT NOT NULL DEFAULT 'medium',
      recommended_vote TEXT NOT NULL DEFAULT 'defer',
      rationale TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '',
      tx_hash TEXT NOT NULL DEFAULT '',
      content_uri TEXT NOT NULL DEFAULT '',
      content_uri_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dao_id) REFERENCES daos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS governance_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dao_id INTEGER,
      proposal_record_id INTEGER,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      action_type TEXT NOT NULL DEFAULT 'record',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dao_id) REFERENCES daos(id) ON DELETE SET NULL,
      FOREIGN KEY (proposal_record_id) REFERENCES proposals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS snapshot_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dao_id INTEGER NOT NULL,
      artifact_dir TEXT NOT NULL DEFAULT '',
      checkpoint_path TEXT NOT NULL DEFAULT '',
      operating_context_path TEXT NOT NULL DEFAULT '',
      proposal_summary_path TEXT NOT NULL DEFAULT '',
      process_queue_path TEXT NOT NULL DEFAULT '',
      direct_state_path TEXT NOT NULL DEFAULT '',
      last_graph_proposal_id_seen INTEGER NOT NULL DEFAULT 0,
      last_passed_proposal_id_incorporated TEXT NOT NULL DEFAULT '',
      voting_count INTEGER NOT NULL DEFAULT 0,
      needs_processing_count INTEGER NOT NULL DEFAULT 0,
      pending_action_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'missing',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dao_id) REFERENCES daos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dao_id INTEGER NOT NULL,
      table_name TEXT NOT NULL DEFAULT 'communityMemory',
      record_id TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL DEFAULT '',
      content_uri TEXT NOT NULL DEFAULT '',
      thread_id TEXT NOT NULL DEFAULT '',
      topic_id TEXT NOT NULL DEFAULT '',
      proposal_id TEXT NOT NULL DEFAULT '',
      record_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dao_id) REFERENCES daos(id) ON DELETE CASCADE
    );
  `);

  ensureColumn(database, "daos", "community_memory_uri", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "daos", "proposal_workspace_uri", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "daos", "shared_state_uri", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "proposals", "content_uri", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "proposals", "content_uri_type", "TEXT NOT NULL DEFAULT ''");
}

function seed(database: Database.Database) {
  if (process.env.SEED_DEMO_DATA !== "true") {
    return;
  }

  const count = database.prepare("SELECT COUNT(*) as count FROM daos").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const daoInsert = database.prepare(`
    INSERT INTO daos (name, dao_address, chain_id, daohaus_url, charter, thesis, conviction, platform, voting_power, status)
    VALUES (@name, @daoAddress, @chainId, @daohausUrl, @charter, @thesis, @conviction, @platform, @votingPower, @status)
  `);
  const proposalInsert = database.prepare(`
    INSERT INTO proposals (dao_id, proposal_id, title, summary, proposal_type, status, agent_stance, confidence, recommended_vote, rationale, due_date)
    VALUES (@daoId, @proposalId, @title, @summary, @proposalType, @status, @agentStance, @confidence, @recommendedVote, @rationale, @dueDate)
  `);
  const taskInsert = database.prepare(`
    INSERT INTO governance_tasks (dao_id, proposal_record_id, title, body, action_type, status, priority, due_date)
    VALUES (@daoId, @proposalRecordId, @title, @body, @actionType, @status, @priority, @dueDate)
  `);
  const snapshotInsert = database.prepare(`
    INSERT INTO snapshot_artifacts (
      dao_id, artifact_dir, checkpoint_path, operating_context_path, proposal_summary_path, process_queue_path,
      direct_state_path, last_graph_proposal_id_seen, last_passed_proposal_id_incorporated, voting_count,
      needs_processing_count, pending_action_count, status
    )
    VALUES (
      @daoId, @artifactDir, @checkpointPath, @operatingContextPath, @proposalSummaryPath, @processQueuePath,
      @directStatePath, @lastGraphProposalIdSeen, @lastPassedProposalIdIncorporated, @votingCount,
      @needsProcessingCount, @pendingActionCount, @status
    )
  `);

  const transaction = database.transaction(() => {
    const raidGuild = Number(daoInsert.run({
      name: "RaidGuild Moloch",
      daoAddress: "0x0000000000000000000000000000000000000000",
      chainId: "8453",
      daohausUrl: "https://admin.daohaus.club/#/molochv3/0x2105/0xDAO",
      charter: "Coordinate builders, operators, and capital toward useful onchain work.",
      thesis: "Fund work that increases the guild's reputation, treasury resilience, and member opportunity.",
      conviction: "Vote for clear scopes, accountable stewards, transparent budgets, and work that improves the commons.",
      platform: "Support builder grants with public deliverables. Oppose vague asks, weak accountability, and rushed treasury risk.",
      votingPower: "unknown",
      status: "watching"
    }).lastInsertRowid);

    const metaClawtel = Number(daoInsert.run({
      name: "Meta Clawtel",
      daoAddress: "0x0000000000000000000000000000000000000000",
      chainId: "8453",
      daohausUrl: "https://admin.daohaus.club/#/molochv3/0x2105/0xDAO",
      charter: "Prototype agent-friendly DAO operations and Moloch governance workflows.",
      thesis: "Use lightweight proposals and explicit voter platforms to make agent governance legible.",
      conviction: "Prefer reversible experiments, documented permissions, and small treasury movements until patterns are proven.",
      platform: "Vote yes on scoped experiments with owners and review dates. Defer anything missing proposalData, risks, or quorum context.",
      votingPower: "unknown",
      status: "active"
    }).lastInsertRowid);

    const proposal = Number(proposalInsert.run({
      daoId: metaClawtel,
      proposalId: "1",
      title: "Publish the first agent voter platform",
      summary: "Signal the DAO's initial voter expectations and let members critique the agent's operating policy.",
      proposalType: "SIGNAL",
      status: "voting",
      agentStance: "support",
      confidence: "high",
      recommendedVote: "yes",
      rationale: "The proposal creates public constraints before the agent participates in higher-impact votes.",
      dueDate: todayOffset(1)
    }).lastInsertRowid);

    proposalInsert.run({
      daoId: raidGuild,
      proposalId: "24",
      title: "Review treasury coordination process",
      summary: "Assess whether current proposal review steps make responsibilities and budget risk clear enough.",
      proposalType: "SIGNAL",
      status: "submitted",
      agentStance: "watch",
      confidence: "medium",
      recommendedVote: "defer",
      rationale: "Needs a fresh checkpoint, DAO state, vote history, and any discussion links before mandate alignment is credible.",
      dueDate: todayOffset(3)
    });

    taskInsert.run({
      daoId: metaClawtel,
      proposalRecordId: proposal,
      title: "Refresh service-backed DAO sync",
      body: "Run /app/api/sync/dao so the agent has DAO profile, proposal list, DAO database memory, and process queue state before deciding.",
      actionType: "read-dao",
      status: "open",
      priority: "urgent",
      dueDate: todayOffset(0)
    });

    taskInsert.run({
      daoId: metaClawtel,
      proposalRecordId: proposal,
      title: "Write vote memo from mandate and lifecycle",
      body: "Use the agent mandate and moloch-agent proposal-lifecycle output to compare proposal state against the governance mandate.",
      actionType: "check-proposal",
      status: "open",
      priority: "urgent",
      dueDate: todayOffset(0)
    });

    taskInsert.run({
      daoId: metaClawtel,
      proposalRecordId: proposal,
      title: "Build unsigned yes vote for review",
      body: "Use moloch-proposal-actions to build the vote transaction JSON. Broadcast only after explicit approval.",
      actionType: "vote",
      status: "open",
      priority: "high",
      dueDate: todayOffset(1)
    });

    taskInsert.run({
      daoId: raidGuild,
      proposalRecordId: null,
      title: "Replace placeholder DAO addresses",
      body: "Store each DAO's Base Baal address, DAOhaus route, charter, thesis, and agent voter platform.",
      actionType: "record",
      status: "doing",
      priority: "high",
      dueDate: todayOffset(0)
    });

    snapshotInsert.run({
      daoId: metaClawtel,
      artifactDir: "workspace/runtime/moloch-artifacts/0xDAO",
      checkpointPath: "workspace/runtime/moloch-artifacts/0xDAO/checkpoint.json",
      operatingContextPath: "workspace/runtime/moloch-artifacts/0xDAO/operating-context.json",
      proposalSummaryPath: "workspace/runtime/moloch-artifacts/0xDAO/proposal-summary.json",
      processQueuePath: "workspace/runtime/moloch-artifacts/0xDAO/process-queue.json",
      directStatePath: "workspace/runtime/moloch-artifacts/0xDAO/direct-state.json",
      lastGraphProposalIdSeen: 1,
      lastPassedProposalIdIncorporated: "",
      votingCount: 1,
      needsProcessingCount: 0,
      pendingActionCount: 2,
      status: "manual"
    });
  });

  transaction();
}

export function getGovernanceBundle(status?: string) {
  const daos = listDaos();
  const proposals = listProposals(status);
  const allProposals = listProposals();
  const tasks = listTasks();
  const artifacts = listSnapshotArtifacts();
  const communityRecords = listCommunityRecords();

  return {
    daos,
    proposals,
    tasks,
    artifacts,
    communityRecords,
    stats: {
      daoCount: daos.length,
      activeDaos: daos.filter((dao) => dao.status === "active").length,
      openProposals: allProposals.filter((proposal) => ["submitted", "voting", "grace", "ready"].includes(proposal.status)).length,
      readyToVote: allProposals.filter((proposal) => proposal.status === "voting" && proposal.recommendedVote !== "defer").length,
      openTasks: tasks.filter((task) => task.status !== "done").length,
      urgentTasks: tasks.filter((task) => task.status !== "done" && task.priority === "urgent").length,
      freshArtifacts: artifacts.filter((artifact) => artifact.status === "fresh").length,
      pendingArtifactActions: artifacts.reduce((sum, artifact) => sum + artifact.pendingActionCount, 0),
      communityRecords: communityRecords.length
    }
  };
}

export function listDaos() {
  return getDb().prepare(`
    SELECT
      id,
      name,
      dao_address as daoAddress,
      chain_id as chainId,
      daohaus_url as daohausUrl,
      community_memory_uri as communityMemoryUri,
      proposal_workspace_uri as proposalWorkspaceUri,
      shared_state_uri as sharedStateUri,
      charter,
      thesis,
      conviction,
      platform,
      voting_power as votingPower,
      status,
      created_at as createdAt,
      updated_at as updatedAt
    FROM daos
    ORDER BY CASE status WHEN 'active' THEN 1 WHEN 'watching' THEN 2 ELSE 3 END, name ASC
  `).all() as Dao[];
}

export function listProposals(status?: string) {
  const cleanStatus = status && proposalStatuses.has(status) ? status : undefined;
  const query = `
    SELECT
      proposals.id,
      proposals.dao_id as daoId,
      daos.name as daoName,
      daos.dao_address as daoAddress,
      proposals.proposal_id as proposalId,
      proposals.title,
      proposals.summary,
      proposals.proposal_type as proposalType,
      proposals.status,
      proposals.agent_stance as agentStance,
      proposals.confidence,
      proposals.recommended_vote as recommendedVote,
      proposals.rationale,
      proposals.due_date as dueDate,
      proposals.tx_hash as txHash,
      proposals.content_uri as contentUri,
      proposals.content_uri_type as contentUriType,
      proposals.created_at as createdAt,
      proposals.updated_at as updatedAt
    FROM proposals
    JOIN daos ON daos.id = proposals.dao_id
    ${cleanStatus ? "WHERE proposals.status = ?" : ""}
    ORDER BY
      CASE proposals.status WHEN 'voting' THEN 1 WHEN 'ready' THEN 2 WHEN 'submitted' THEN 3 WHEN 'grace' THEN 4 ELSE 5 END,
      proposals.due_date ASC,
      proposals.updated_at DESC
  `;

  return (cleanStatus ? getDb().prepare(query).all(cleanStatus) : getDb().prepare(query).all()) as Proposal[];
}

export function listTasks(status?: string) {
  const cleanStatus = status && taskStatuses.has(status) ? status : undefined;
  const query = `
    SELECT
      governance_tasks.id,
      governance_tasks.dao_id as daoId,
      daos.name as daoName,
      governance_tasks.proposal_record_id as proposalRecordId,
      proposals.title as proposalTitle,
      governance_tasks.title,
      governance_tasks.body,
      governance_tasks.action_type as actionType,
      governance_tasks.status,
      governance_tasks.priority,
      governance_tasks.due_date as dueDate,
      governance_tasks.created_at as createdAt,
      governance_tasks.updated_at as updatedAt
    FROM governance_tasks
    LEFT JOIN daos ON daos.id = governance_tasks.dao_id
    LEFT JOIN proposals ON proposals.id = governance_tasks.proposal_record_id
    ${cleanStatus ? "WHERE governance_tasks.status = ?" : ""}
    ORDER BY
      CASE governance_tasks.status WHEN 'doing' THEN 1 WHEN 'open' THEN 2 ELSE 3 END,
      CASE governance_tasks.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      governance_tasks.due_date ASC,
      governance_tasks.updated_at DESC
  `;

  return (cleanStatus ? getDb().prepare(query).all(cleanStatus) : getDb().prepare(query).all()) as GovernanceTask[];
}

export function listSnapshotArtifacts() {
  return getDb().prepare(`
    SELECT
      snapshot_artifacts.id,
      snapshot_artifacts.dao_id as daoId,
      daos.name as daoName,
      daos.dao_address as daoAddress,
      snapshot_artifacts.artifact_dir as artifactDir,
      snapshot_artifacts.checkpoint_path as checkpointPath,
      snapshot_artifacts.operating_context_path as operatingContextPath,
      snapshot_artifacts.proposal_summary_path as proposalSummaryPath,
      snapshot_artifacts.process_queue_path as processQueuePath,
      snapshot_artifacts.direct_state_path as directStatePath,
      snapshot_artifacts.updated_at as updatedAt,
      snapshot_artifacts.last_graph_proposal_id_seen as lastGraphProposalIdSeen,
      snapshot_artifacts.last_passed_proposal_id_incorporated as lastPassedProposalIdIncorporated,
      snapshot_artifacts.voting_count as votingCount,
      snapshot_artifacts.needs_processing_count as needsProcessingCount,
      snapshot_artifacts.pending_action_count as pendingActionCount,
      snapshot_artifacts.status,
      snapshot_artifacts.created_at as createdAt
    FROM snapshot_artifacts
    JOIN daos ON daos.id = snapshot_artifacts.dao_id
    ORDER BY snapshot_artifacts.updated_at DESC
  `).all() as SnapshotArtifact[];
}

export function listCommunityRecords(daoId?: number) {
  const query = `
    SELECT
      community_records.id,
      community_records.dao_id as daoId,
      daos.name as daoName,
      daos.dao_address as daoAddress,
      community_records.table_name as tableName,
      community_records.record_id as recordId,
      community_records.content,
      community_records.content_json as contentJson,
      community_records.content_uri as contentUri,
      community_records.thread_id as threadId,
      community_records.topic_id as topicId,
      community_records.proposal_id as proposalId,
      community_records.record_type as recordType,
      community_records.created_at as createdAt,
      community_records.updated_at as updatedAt
    FROM community_records
    JOIN daos ON daos.id = community_records.dao_id
    ${daoId ? "WHERE community_records.dao_id = ?" : ""}
    ORDER BY community_records.created_at DESC, community_records.updated_at DESC
  `;

  return (daoId ? getDb().prepare(query).all(daoId) : getDb().prepare(query).all()) as CommunityRecord[];
}

export function upsertSnapshotArtifact(input: SnapshotInput) {
  const daoId = Number(input.daoId);
  if (!Number.isInteger(daoId) || !getDao(daoId)) {
    throw new Error("valid daoId is required");
  }

  const existing = listSnapshotArtifacts().find((artifact) => artifact.daoId === daoId);
  const artifactDir = input.artifactDir?.trim() || existing?.artifactDir || `workspace/runtime/moloch-artifacts/${getDaoOrThrow(daoId).daoAddress || "0xDAO"}`;
  const checkpointPath = input.checkpointPath?.trim() || existing?.checkpointPath || `${artifactDir}/checkpoint.json`;
  const operatingContextPath = input.operatingContextPath?.trim() || existing?.operatingContextPath || `${artifactDir}/operating-context.json`;
  const proposalSummaryPath = input.proposalSummaryPath?.trim() || existing?.proposalSummaryPath || `${artifactDir}/proposal-summary.json`;
  const processQueuePath = input.processQueuePath?.trim() || existing?.processQueuePath || `${artifactDir}/process-queue.json`;
  const directStatePath = input.directStatePath?.trim() || existing?.directStatePath || `${artifactDir}/direct-state.json`;

  if (existing) {
    getDb().prepare(`
      UPDATE snapshot_artifacts
      SET artifact_dir = ?, checkpoint_path = ?, operating_context_path = ?, proposal_summary_path = ?,
        process_queue_path = ?, direct_state_path = ?, last_graph_proposal_id_seen = ?,
        last_passed_proposal_id_incorporated = ?, voting_count = ?, needs_processing_count = ?,
        pending_action_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      artifactDir,
      checkpointPath,
      operatingContextPath,
      proposalSummaryPath,
      processQueuePath,
      directStatePath,
      numberValue(input.lastGraphProposalIdSeen, existing.lastGraphProposalIdSeen),
      value(input.lastPassedProposalIdIncorporated, existing.lastPassedProposalIdIncorporated),
      numberValue(input.votingCount, existing.votingCount),
      numberValue(input.needsProcessingCount, existing.needsProcessingCount),
      numberValue(input.pendingActionCount, existing.pendingActionCount),
      normalize(input.status ?? existing.status, artifactStatuses, "manual"),
      existing.id
    );
    return listSnapshotArtifacts().find((artifact) => artifact.id === existing.id);
  }

  const result = getDb().prepare(`
    INSERT INTO snapshot_artifacts (
      dao_id, artifact_dir, checkpoint_path, operating_context_path, proposal_summary_path, process_queue_path,
      direct_state_path, last_graph_proposal_id_seen, last_passed_proposal_id_incorporated, voting_count,
      needs_processing_count, pending_action_count, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    daoId,
    artifactDir,
    checkpointPath,
    operatingContextPath,
    proposalSummaryPath,
    processQueuePath,
    directStatePath,
    numberValue(input.lastGraphProposalIdSeen, 0),
    input.lastPassedProposalIdIncorporated?.trim() ?? "",
    numberValue(input.votingCount, 0),
    numberValue(input.needsProcessingCount, 0),
    numberValue(input.pendingActionCount, 0),
    normalize(input.status, artifactStatuses, "manual")
  );

  return listSnapshotArtifacts().find((artifact) => artifact.id === Number(result.lastInsertRowid));
}

export function createDao(input: DaoInput) {
  const name = required(input.name, "name");
  const database = getDb();
  const result = database.prepare(`
    INSERT INTO daos (
      name, dao_address, chain_id, daohaus_url, community_memory_uri, proposal_workspace_uri, shared_state_uri,
      charter, thesis, conviction, platform, voting_power, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    input.daoAddress?.trim() ?? "",
    input.chainId?.trim() || "8453",
    input.daohausUrl?.trim() ?? "",
    input.communityMemoryUri?.trim() ?? "",
    input.proposalWorkspaceUri?.trim() ?? "",
    input.sharedStateUri?.trim() ?? "",
    input.charter?.trim() ?? "",
    input.thesis?.trim() ?? "",
    input.conviction?.trim() ?? "",
    input.platform?.trim() ?? "",
    input.votingPower?.trim() || "unknown",
    normalize(input.status, daoStatuses, "active")
  );

  return getDao(Number(result.lastInsertRowid));
}

export function updateDao(id: number, input: DaoInput) {
  const existing = getDaoOrThrow(id);
  const name = input.name === undefined ? existing.name : required(input.name, "name");
  getDb().prepare(`
    UPDATE daos
    SET name = ?, dao_address = ?, chain_id = ?, daohaus_url = ?, community_memory_uri = ?,
      proposal_workspace_uri = ?, shared_state_uri = ?, charter = ?, thesis = ?, conviction = ?, platform = ?,
      voting_power = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name,
    value(input.daoAddress, existing.daoAddress),
    value(input.chainId, existing.chainId) || "8453",
    value(input.daohausUrl, existing.daohausUrl),
    value(input.communityMemoryUri, existing.communityMemoryUri),
    value(input.proposalWorkspaceUri, existing.proposalWorkspaceUri),
    value(input.sharedStateUri, existing.sharedStateUri),
    value(input.charter, existing.charter),
    value(input.thesis, existing.thesis),
    value(input.conviction, existing.conviction),
    value(input.platform, existing.platform),
    value(input.votingPower, existing.votingPower) || "unknown",
    normalize(input.status ?? existing.status, daoStatuses, "active"),
    id
  );
  return getDao(id);
}

export function upsertProposalByDaoProposalId(input: ProposalInput & { daoId: number; proposalId: string }) {
  const existing = listProposals().find((proposal) => proposal.daoId === input.daoId && proposal.proposalId === input.proposalId);
  if (existing) {
    return updateProposal(existing.id, input);
  }
  return createProposal(input);
}

export function upsertCommunityRecord(input: CommunityRecordInput) {
  const daoId = Number(input.daoId);
  if (!Number.isInteger(daoId) || !getDao(daoId)) {
    throw new Error("valid daoId is required");
  }

  const tableName = input.tableName?.trim() || "communityMemory";
  const recordId = input.recordId?.trim() || `${tableName}:${input.threadId || input.topicId || input.proposalId || Date.now()}`;
  const existing = listCommunityRecords(daoId).find((record) => record.tableName === tableName && record.recordId === recordId);
  const content = input.content?.trim() ?? "";
  const contentJson = input.contentJson?.trim() ?? "";
  const contentUri = input.contentUri?.trim() ?? "";
  const threadId = input.threadId?.trim() ?? "";
  const topicId = input.topicId?.trim() ?? "";
  const proposalId = input.proposalId?.trim() ?? "";
  const recordType = input.recordType?.trim() ?? "";
  const createdAt = input.createdAt?.trim() || new Date().toISOString();

  if (existing) {
    getDb().prepare(`
      UPDATE community_records
      SET content = ?, content_json = ?, content_uri = ?, thread_id = ?, topic_id = ?, proposal_id = ?,
        record_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, contentJson, contentUri, threadId, topicId, proposalId, recordType, existing.id);
    return listCommunityRecords(daoId).find((record) => record.id === existing.id);
  }

  const result = getDb().prepare(`
    INSERT INTO community_records (
      dao_id, table_name, record_id, content, content_json, content_uri, thread_id, topic_id, proposal_id, record_type, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(daoId, tableName, recordId, content, contentJson, contentUri, threadId, topicId, proposalId, recordType, createdAt);
  return listCommunityRecords(daoId).find((record) => record.id === Number(result.lastInsertRowid));
}

export function deleteDao(id: number) {
  const result = getDb().prepare("DELETE FROM daos WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("dao not found");
  }
}

export function createProposal(input: ProposalInput) {
  const daoId = Number(input.daoId);
  if (!Number.isInteger(daoId) || !getDao(daoId)) {
    throw new Error("valid daoId is required");
  }

  const title = required(input.title, "title");
  const result = getDb().prepare(`
    INSERT INTO proposals (
      dao_id, proposal_id, title, summary, proposal_type, status, agent_stance, confidence,
      recommended_vote, rationale, due_date, tx_hash, content_uri, content_uri_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    daoId,
    input.proposalId?.trim() || "unknown",
    title,
    input.summary?.trim() ?? "",
    input.proposalType?.trim() || "SIGNAL",
    normalize(input.status, proposalStatuses, "submitted"),
    normalize(input.agentStance, stances, "watch"),
    input.confidence?.trim() || "medium",
    normalize(input.recommendedVote, votes, "defer"),
    input.rationale?.trim() ?? "",
    input.dueDate?.trim() ?? "",
    input.txHash?.trim() ?? "",
    input.contentUri?.trim() ?? "",
    input.contentUriType?.trim() ?? ""
  );

  return getProposal(Number(result.lastInsertRowid));
}

export function updateProposal(id: number, input: ProposalInput) {
  const existing = getProposalOrThrow(id);
  const daoId = input.daoId === undefined ? existing.daoId : Number(input.daoId);
  if (!Number.isInteger(daoId) || !getDao(daoId)) {
    throw new Error("valid daoId is required");
  }

  getDb().prepare(`
    UPDATE proposals
    SET dao_id = ?, proposal_id = ?, title = ?, summary = ?, proposal_type = ?, status = ?, agent_stance = ?,
      confidence = ?, recommended_vote = ?, rationale = ?, due_date = ?, tx_hash = ?, content_uri = ?,
      content_uri_type = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    daoId,
    value(input.proposalId, existing.proposalId) || "unknown",
    input.title === undefined ? existing.title : required(input.title, "title"),
    value(input.summary, existing.summary),
    value(input.proposalType, existing.proposalType) || "SIGNAL",
    normalize(input.status ?? existing.status, proposalStatuses, "submitted"),
    normalize(input.agentStance ?? existing.agentStance, stances, "watch"),
    value(input.confidence, existing.confidence) || "medium",
    normalize(input.recommendedVote ?? existing.recommendedVote, votes, "defer"),
    value(input.rationale, existing.rationale),
    value(input.dueDate, existing.dueDate),
    value(input.txHash, existing.txHash),
    value(input.contentUri, existing.contentUri),
    value(input.contentUriType, existing.contentUriType),
    id
  );

  return getProposal(id);
}

export function deleteProposal(id: number) {
  const result = getDb().prepare("DELETE FROM proposals WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("proposal not found");
  }
}

export function createTask(input: TaskInput) {
  const title = required(input.title, "title");
  const result = getDb().prepare(`
    INSERT INTO governance_tasks (dao_id, proposal_record_id, title, body, action_type, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nullableId(input.daoId, "daoId"),
    nullableId(input.proposalRecordId, "proposalRecordId"),
    title,
    input.body?.trim() ?? "",
    normalize(input.actionType, actionTypes, "record"),
    normalize(input.status, taskStatuses, "open"),
    normalize(input.priority, priorities, "normal"),
    input.dueDate?.trim() ?? ""
  );

  return getTask(Number(result.lastInsertRowid));
}

export function updateTask(id: number, input: TaskInput) {
  const existing = getTaskOrThrow(id);
  getDb().prepare(`
    UPDATE governance_tasks
    SET dao_id = ?, proposal_record_id = ?, title = ?, body = ?, action_type = ?, status = ?, priority = ?, due_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    input.daoId === undefined ? existing.daoId : nullableId(input.daoId, "daoId"),
    input.proposalRecordId === undefined ? existing.proposalRecordId : nullableId(input.proposalRecordId, "proposalRecordId"),
    input.title === undefined ? existing.title : required(input.title, "title"),
    value(input.body, existing.body),
    normalize(input.actionType ?? existing.actionType, actionTypes, "record"),
    normalize(input.status ?? existing.status, taskStatuses, "open"),
    normalize(input.priority ?? existing.priority, priorities, "normal"),
    value(input.dueDate, existing.dueDate),
    id
  );

  return getTask(id);
}

export function deleteTask(id: number) {
  const result = getDb().prepare("DELETE FROM governance_tasks WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("task not found");
  }
}

function getDao(id: number) {
  return listDaos().find((dao) => dao.id === id);
}

function getProposal(id: number) {
  return listProposals().find((proposal) => proposal.id === id);
}

function getTask(id: number) {
  return listTasks().find((task) => task.id === id);
}

function getDaoOrThrow(id: number) {
  const dao = getDao(id);
  if (!dao) throw new Error("dao not found");
  return dao;
}

function getProposalOrThrow(id: number) {
  const proposal = getProposal(id);
  if (!proposal) throw new Error("proposal not found");
  return proposal;
}

function getTaskOrThrow(id: number) {
  const task = getTask(id);
  if (!task) throw new Error("task not found");
  return task;
}

function required(value: string | undefined, field: string) {
  const clean = value?.trim();
  if (!clean) {
    throw new Error(`${field} is required`);
  }
  return clean;
}

function value(next: string | undefined, current: string) {
  return next === undefined ? current : next.trim();
}

function numberValue(next: number | undefined, current: number) {
  if (next === undefined) {
    return current;
  }

  const clean = Number(next);
  return Number.isFinite(clean) && clean >= 0 ? clean : current;
}

function normalize(value: string | undefined, allowed: Set<string>, fallback: string) {
  const clean = value?.trim().toLowerCase() || fallback;
  return allowed.has(clean) ? clean : fallback;
}

function nullableId(value: number | null | undefined, field: string) {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`valid ${field} is required`);
  }

  return id;
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((item) => item.name === column)) {
    return;
  }
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
