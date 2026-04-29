import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type QuestStatus = "open" | "claimed" | "review" | "done";

export type Quest = {
  id: number;
  title: string;
  summary: string;
  status: QuestStatus;
  owner: string;
  outcome: string;
  dueDate: string;
  points: number;
  createdAt: string;
};

export type QuestUpdate = {
  id: number;
  questId: number;
  author: string;
  body: string;
  createdAt: string;
};

export type QuestBundle = {
  quests: Quest[];
  selected: Quest | null;
  updates: QuestUpdate[];
  recap: {
    completed: Quest[];
    inFlight: Quest[];
    open: Quest[];
    pointsShipped: number;
    highlights: string[];
  };
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "community-quest-board.sqlite");

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
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      owner TEXT NOT NULL DEFAULT '',
      outcome TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '',
      points INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quest_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id INTEGER NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM quests").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertQuest = database.prepare(`
    INSERT INTO quests (title, summary, status, owner, outcome, due_date, points, created_at)
    VALUES (@title, @summary, @status, @owner, @outcome, @dueDate, @points, @createdAt)
  `);
  const insertUpdate = database.prepare("INSERT INTO quest_updates (quest_id, author, body, created_at) VALUES (?, ?, ?, ?)");

  const quests = [
    {
      title: "Map onboarding blockers",
      summary: "Collect the top three moments where new cohort members stall during week one.",
      status: "claimed",
      owner: "Mira",
      outcome: "",
      dueDate: todayOffset(2),
      points: 3,
      createdAt: todayOffset(-5),
      updates: ["Interviewed two new members; both missed the project glossary."]
    },
    {
      title: "Publish demo night recap",
      summary: "Turn demo notes into a short recap with shipped links, asks, and next milestones.",
      status: "review",
      owner: "Devon",
      outcome: "Draft recap is ready for steward review.",
      dueDate: todayOffset(1),
      points: 2,
      createdAt: todayOffset(-3),
      updates: ["Added links for four demos and flagged two projects that need screenshots."]
    },
    {
      title: "Pair contributors on docs",
      summary: "Match two first-time contributors with maintainers for a low-risk documentation pass.",
      status: "open",
      owner: "",
      outcome: "",
      dueDate: todayOffset(4),
      points: 2,
      createdAt: todayOffset(-1),
      updates: []
    },
    {
      title: "Close sponsor thank-you loop",
      summary: "Send a concise thank-you note and gather a quote for the next community update.",
      status: "done",
      owner: "Nia",
      outcome: "Sponsor quote captured and added to the weekly recap.",
      dueDate: todayOffset(-1),
      points: 1,
      createdAt: todayOffset(-6),
      updates: ["Quote approved and saved in the sponsor notes thread."]
    }
  ];

  const transaction = database.transaction(() => {
    for (const quest of quests) {
      const result = insertQuest.run(quest);
      const questId = Number(result.lastInsertRowid);
      for (const update of quest.updates) {
        insertUpdate.run(questId, quest.owner || "Steward", update, `${todayOffset(-1)} 10:00:00`);
      }
    }
  });

  transaction();
}

export function listQuests() {
  return getDb().prepare(`
    SELECT
      id,
      title,
      summary,
      status,
      owner,
      outcome,
      due_date as dueDate,
      points,
      created_at as createdAt
    FROM quests
    ORDER BY
      CASE status
        WHEN 'open' THEN 1
        WHEN 'claimed' THEN 2
        WHEN 'review' THEN 3
        WHEN 'done' THEN 4
        ELSE 5
      END,
      due_date ASC
  `).all() as Quest[];
}

export function getQuestBundle(questId?: number): QuestBundle {
  const quests = listQuests();
  const selected = quests.find((quest) => quest.id === questId) ?? quests[0] ?? null;
  const selectedId = selected?.id ?? 0;
  const updates = getDb()
    .prepare("SELECT id, quest_id as questId, author, body, created_at as createdAt FROM quest_updates WHERE quest_id = ? ORDER BY created_at DESC")
    .all(selectedId) as QuestUpdate[];

  return {
    quests,
    selected,
    updates,
    recap: buildRecap(quests)
  };
}

export function updateQuest(input: {
  questId: number;
  author: string;
  body: string;
  status: string;
  owner: string;
  outcome: string;
}) {
  const cleanBody = input.body.trim();
  if (!cleanBody) {
    throw new Error("Update is required.");
  }

  const status = normalizeStatus(input.status);
  const database = getDb();
  const transaction = database.transaction(() => {
    database
      .prepare("UPDATE quests SET status = ?, owner = ?, outcome = ? WHERE id = ?")
      .run(status, input.owner.trim(), input.outcome.trim(), input.questId);
    database
      .prepare("INSERT INTO quest_updates (quest_id, author, body, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
      .run(input.questId, input.author.trim() || "Steward", cleanBody);
  });

  transaction();
}

function buildRecap(quests: QuestBundle["quests"]) {
  const completed = quests.filter((quest) => quest.status === "done");
  const inFlight = quests.filter((quest) => quest.status === "claimed" || quest.status === "review");
  const open = quests.filter((quest) => quest.status === "open");
  const pointsShipped = completed.reduce((total, quest) => total + quest.points, 0);

  return {
    completed,
    inFlight,
    open,
    pointsShipped,
    highlights: completed.map((quest) => quest.outcome).filter(Boolean).slice(0, 3)
  };
}

function normalizeStatus(value: string): QuestStatus {
  if (value === "claimed" || value === "review" || value === "done") {
    return value;
  }

  return "open";
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
