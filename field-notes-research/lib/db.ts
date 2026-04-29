import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type FieldNote = {
  id: number;
  title: string;
  source: string;
  sourceType: string;
  body: string;
  quote: string;
  tags: string;
  theme: string;
  followUp: string;
  createdAt: string;
};

export type Theme = {
  name: string;
  noteCount: number;
  latestSignal: string;
};

export type ResearchBundle = {
  notes: FieldNote[];
  themes: Theme[];
  sources: string[];
  tags: string[];
  summary: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "field-notes-research.sqlite");

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
    CREATE TABLE IF NOT EXISTS field_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      quote TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT '',
      follow_up TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM field_notes").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertNote = database.prepare(`
    INSERT INTO field_notes (title, source, source_type, body, quote, tags, theme, follow_up, created_at)
    VALUES (@title, @source, @sourceType, @body, @quote, @tags, @theme, @followUp, @createdAt)
  `);

  const notes = [
    {
      title: "Onboarding call friction",
      source: "Community Ops Interview",
      sourceType: "Interview",
      body: "New members understand the mission but hesitate when the first contribution path is buried across several channels.",
      quote: "I want to help, but I do not know which thread is the real starting point.",
      tags: "onboarding, contribution, discord",
      theme: "First contribution clarity",
      followUp: "Ask which signal would make the first useful action obvious.",
      createdAt: dayOffset(-4)
    },
    {
      title: "Weekly sync observation",
      source: "Guild Weekly Call",
      sourceType: "Call",
      body: "The team repeatedly converted open questions into owners and dates once someone summarized the unresolved decisions.",
      quote: "Can we turn this into one owner and one next check-in?",
      tags: "meetings, ownership, decisions",
      theme: "Decision capture",
      followUp: "Compare recap formats that preserve decisions without adding admin work.",
      createdAt: dayOffset(-2)
    },
    {
      title: "Discord support pattern",
      source: "#help-desk",
      sourceType: "Discord",
      body: "Experienced members answer faster when requests include context, expected result, and what has already been tried.",
      quote: "Show the attempted command and the error, then people can jump in.",
      tags: "support, templates, knowledge-base",
      theme: "Request quality",
      followUp: "Draft a lightweight request template for repeated support questions.",
      createdAt: dayOffset(-1)
    }
  ];

  const transaction = database.transaction(() => {
    for (const note of notes) {
      insertNote.run(note);
    }
  });

  transaction();
}

export function getResearchBundle(filters?: { source?: string; tag?: string }) {
  const notes = listNotes(filters);
  return {
    notes,
    themes: listThemes(),
    sources: listSources(),
    tags: listTags(),
    summary: buildSummary(notes)
  };
}

export function addFieldNote(input: {
  title?: string;
  source?: string;
  sourceType?: string;
  body?: string;
  quote?: string;
  tags?: string;
  theme?: string;
  followUp?: string;
}) {
  const body = input.body?.trim() ?? "";
  if (!body) {
    throw new Error("Observation is required.");
  }

  getDb()
    .prepare(`
      INSERT INTO field_notes (title, source, source_type, body, quote, tags, theme, follow_up, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .run(
      clean(input.title) || "Untitled field note",
      clean(input.source),
      clean(input.sourceType),
      body,
      clean(input.quote),
      clean(input.tags),
      clean(input.theme) || "Unsorted signals",
      clean(input.followUp)
    );
}

function listNotes(filters?: { source?: string; tag?: string }) {
  const database = getDb();
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters?.source) {
    clauses.push("source = ?");
    params.push(filters.source);
  }

  if (filters?.tag) {
    clauses.push("lower(tags) LIKE ?");
    params.push(`%${filters.tag.toLowerCase()}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return database
    .prepare(`
      SELECT
        id,
        title,
        source,
        source_type as sourceType,
        body,
        quote,
        tags,
        theme,
        follow_up as followUp,
        created_at as createdAt
      FROM field_notes
      ${where}
      ORDER BY datetime(created_at) DESC, id DESC
    `)
    .all(...params) as FieldNote[];
}

function listThemes() {
  return getDb()
    .prepare(`
      SELECT
        theme as name,
        COUNT(*) as noteCount,
        MAX(created_at) as latestSignal
      FROM field_notes
      GROUP BY theme
      ORDER BY noteCount DESC, latestSignal DESC
    `)
    .all() as Theme[];
}

function listSources() {
  const rows = getDb()
    .prepare("SELECT DISTINCT source FROM field_notes WHERE source != '' ORDER BY source")
    .all() as { source: string }[];
  return rows.map((row) => row.source);
}

function listTags() {
  const rows = getDb().prepare("SELECT tags FROM field_notes WHERE tags != ''").all() as { tags: string }[];
  return Array.from(
    new Set(
      rows.flatMap((row) =>
        row.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    )
  ).sort((a, b) => a.localeCompare(b));
}

function buildSummary(notes: FieldNote[]) {
  if (notes.length === 0) {
    return "No matching notes yet.";
  }

  const themes = Array.from(new Set(notes.map((note) => note.theme).filter(Boolean))).slice(0, 3);
  const quotes = notes
    .map((note) => note.quote)
    .filter(Boolean)
    .slice(0, 2);
  const questions = notes
    .map((note) => note.followUp)
    .filter(Boolean)
    .slice(0, 3);

  return [
    `Summary draft: ${notes.length} note${notes.length === 1 ? "" : "s"} point toward ${themes.join(", ") || "emerging unsorted signals"}.`,
    quotes.length > 0 ? `Representative quote: "${quotes[0]}"` : "",
    questions.length > 0 ? `Follow-up questions: ${questions.join(" ")}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function clean(value?: string) {
  return value?.trim() ?? "";
}

function dayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
