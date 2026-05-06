import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Dao = {
  id: number;
  name: string;
  daoAddress: string;
  chainId: string;
  daohausUrl: string;
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

type DaoInput = Partial<Pick<Dao, "name" | "daoAddress" | "chainId" | "daohausUrl" | "charter" | "thesis" | "conviction" | "platform" | "votingPower" | "status">>;
type ProposalInput = Partial<Pick<Proposal, "daoId" | "proposalId" | "title" | "summary" | "proposalType" | "status" | "agentStance" | "confidence" | "recommendedVote" | "rationale" | "dueDate" | "txHash">>;
type TaskInput = Partial<Pick<GovernanceTask, "daoId" | "proposalRecordId" | "title" | "body" | "actionType" | "status" | "priority" | "dueDate">>;

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "agent-of-moloch.sqlite");
const daoStatuses = new Set(["active", "watching", "paused"]);
const proposalStatuses = new Set(["draft", "submitted", "voting", "grace", "ready", "processed", "cancelled"]);
const stances = new Set(["support", "oppose", "abstain", "watch"]);
const votes = new Set(["yes", "no", "abstain", "defer"]);
const taskStatuses = new Set(["open", "doing", "done"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const actionTypes = new Set(["read-dao", "check-proposal", "vote", "sponsor", "process", "record"]);

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
  `);
}

function seed(database: Database.Database) {
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

  const transaction = database.transaction(() => {
    const raidGuild = Number(daoInsert.run({
      name: "RaidGuild Moloch",
      daoAddress: "0x0000000000000000000000000000000000000000",
      chainId: "8453",
      daohausUrl: "https://admin.daohaus.fun/#/molochv3/0x2105/0xDAO",
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
      daohausUrl: "https://admin.daohaus.fun/#/molochv3/0x2105/0xDAO",
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
      rationale: "Needs a fresh read of DAO state, vote history, and any discussion links before conviction is credible.",
      dueDate: todayOffset(3)
    });

    taskInsert.run({
      daoId: metaClawtel,
      proposalRecordId: proposal,
      title: "Read proposal 1 direct state and indexed metadata",
      body: "Run read-proposal and graph-proposal from the Moloch skills before preparing the vote transaction.",
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
  });

  transaction();
}

export function getGovernanceBundle(status?: string) {
  const daos = listDaos();
  const proposals = listProposals(status);
  const allProposals = listProposals();
  const tasks = listTasks();

  return {
    daos,
    proposals,
    tasks,
    stats: {
      daoCount: daos.length,
      activeDaos: daos.filter((dao) => dao.status === "active").length,
      openProposals: allProposals.filter((proposal) => ["submitted", "voting", "grace", "ready"].includes(proposal.status)).length,
      readyToVote: allProposals.filter((proposal) => proposal.status === "voting" && proposal.recommendedVote !== "defer").length,
      openTasks: tasks.filter((task) => task.status !== "done").length,
      urgentTasks: tasks.filter((task) => task.status !== "done" && task.priority === "urgent").length
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

export function createDao(input: DaoInput) {
  const name = required(input.name, "name");
  const database = getDb();
  const result = database.prepare(`
    INSERT INTO daos (name, dao_address, chain_id, daohaus_url, charter, thesis, conviction, platform, voting_power, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    input.daoAddress?.trim() ?? "",
    input.chainId?.trim() || "8453",
    input.daohausUrl?.trim() ?? "",
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
    SET name = ?, dao_address = ?, chain_id = ?, daohaus_url = ?, charter = ?, thesis = ?, conviction = ?, platform = ?,
      voting_power = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name,
    value(input.daoAddress, existing.daoAddress),
    value(input.chainId, existing.chainId) || "8453",
    value(input.daohausUrl, existing.daohausUrl),
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
    INSERT INTO proposals (dao_id, proposal_id, title, summary, proposal_type, status, agent_stance, confidence, recommended_vote, rationale, due_date, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    input.txHash?.trim() ?? ""
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
      confidence = ?, recommended_vote = ?, rationale = ?, due_date = ?, tx_hash = ?, updated_at = CURRENT_TIMESTAMP
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
