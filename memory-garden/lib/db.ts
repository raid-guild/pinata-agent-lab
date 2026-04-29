import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Topic = {
  id: number;
  name: string;
  color: string;
  description: string;
  memoryCount: number;
  latestActivity: string;
};

export type Memory = {
  id: number;
  title: string;
  body: string;
  topicId: number;
  topicName: string;
  topicColor: string;
  growth: number;
  lastSeenAt: string;
  createdAt: string;
};

export type MemoryLink = {
  id: number;
  sourceId: number;
  targetId: number;
  note: string;
  sourceTitle: string;
  targetTitle: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "memory-garden.sqlite");

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
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#2f7d66',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      growth INTEGER NOT NULL DEFAULT 1,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES memories(id) ON DELETE CASCADE
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM topics").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertTopic = database.prepare("INSERT INTO topics (name, color, description) VALUES (?, ?, ?)");
  const insertMemory = database.prepare(`
    INSERT INTO memories (title, body, topic_id, growth, last_seen_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertLink = database.prepare("INSERT INTO memory_links (source_id, target_id, note) VALUES (?, ?, ?)");

  const transaction = database.transaction(() => {
    const systemsId = Number(insertTopic.run("Systems Thinking", "#2f7d66", "Reusable patterns, feedback loops, and operating principles.").lastInsertRowid);
    const craftId = Number(insertTopic.run("Creative Practice", "#a05a2c", "Notes about rhythm, voice, drafts, and attention.").lastInsertRowid);
    const peopleId = Number(insertTopic.run("People Signals", "#5867a3", "Small observations from conversations and communities.").lastInsertRowid);

    const first = Number(
      insertMemory.run(
        "Friction is data",
        "When a workflow feels slow, the resistance usually points at an unclear handoff or an overloaded decision.",
        systemsId,
        4,
        dayOffset(-34),
        dayOffset(-68)
      ).lastInsertRowid
    );
    const second = Number(
      insertMemory.run(
        "Small daily captures beat heroic reviews",
        "A two sentence note written today is more useful than a perfect synthesis postponed until the context is gone.",
        craftId,
        3,
        dayOffset(-8),
        dayOffset(-26)
      ).lastInsertRowid
    );
    const third = Number(
      insertMemory.run(
        "Questions reveal ownership",
        "The person asking about edge cases often understands where the real operational burden will land.",
        peopleId,
        2,
        dayOffset(-47),
        dayOffset(-52)
      ).lastInsertRowid
    );
    const fourth = Number(
      insertMemory.run(
        "Clusters need bridges",
        "A garden becomes useful when ideas from separate topics are linked by concrete examples, not just tags.",
        systemsId,
        5,
        dayOffset(-2),
        dayOffset(-14)
      ).lastInsertRowid
    );

    insertLink.run(first, fourth, "Both turn vague discomfort into a navigable structure.");
    insertLink.run(second, third, "Capture conversational signals while they are still fresh.");
  });

  transaction();
}

export function getGardenBundle(topicId?: number) {
  const database = getDb();
  const topics = database.prepare(`
    SELECT
      topics.id,
      topics.name,
      topics.color,
      topics.description,
      COUNT(memories.id) as memoryCount,
      COALESCE(MAX(memories.last_seen_at), topics.created_at) as latestActivity
    FROM topics
    LEFT JOIN memories ON memories.topic_id = topics.id
    GROUP BY topics.id
    ORDER BY latestActivity DESC
  `).all() as Topic[];

  const selectedTopic = topics.find((topic) => topic.id === topicId) ?? topics[0] ?? null;
  const selectedId = selectedTopic?.id ?? 0;
  const memories = database.prepare(`
    SELECT
      memories.id,
      memories.title,
      memories.body,
      memories.topic_id as topicId,
      topics.name as topicName,
      topics.color as topicColor,
      memories.growth,
      memories.last_seen_at as lastSeenAt,
      memories.created_at as createdAt
    FROM memories
    JOIN topics ON topics.id = memories.topic_id
    WHERE memories.topic_id = ?
    ORDER BY memories.growth DESC, memories.last_seen_at DESC
  `).all(selectedId) as Memory[];

  const allMemories = database.prepare(`
    SELECT
      memories.id,
      memories.title,
      memories.body,
      memories.topic_id as topicId,
      topics.name as topicName,
      topics.color as topicColor,
      memories.growth,
      memories.last_seen_at as lastSeenAt,
      memories.created_at as createdAt
    FROM memories
    JOIN topics ON topics.id = memories.topic_id
    ORDER BY memories.last_seen_at DESC
  `).all() as Memory[];

  return {
    topics,
    selectedTopic,
    memories,
    allMemories,
    links: listLinks(),
    resurfaced: database.prepare(`
      SELECT
        memories.id,
        memories.title,
        memories.body,
        memories.topic_id as topicId,
        topics.name as topicName,
        topics.color as topicColor,
        memories.growth,
        memories.last_seen_at as lastSeenAt,
        memories.created_at as createdAt
      FROM memories
      JOIN topics ON topics.id = memories.topic_id
      ORDER BY memories.last_seen_at ASC, memories.growth DESC
      LIMIT 3
    `).all() as Memory[]
  };
}

export function addMemory(title: string, body: string, topicId: number, growth: number) {
  const cleanTitle = title.trim();
  const cleanBody = body.trim();
  if (!cleanTitle || !cleanBody) {
    throw new Error("Title and note are required.");
  }

  const safeGrowth = Math.max(1, Math.min(5, Number(growth) || 1));
  getDb()
    .prepare("INSERT INTO memories (title, body, topic_id, growth, last_seen_at, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    .run(cleanTitle, cleanBody, topicId, safeGrowth);
}

export function addLink(sourceId: number, targetId: number, note: string) {
  if (!sourceId || !targetId || sourceId === targetId) {
    throw new Error("Choose two different memories to link.");
  }

  getDb().prepare("INSERT INTO memory_links (source_id, target_id, note) VALUES (?, ?, ?)").run(sourceId, targetId, note.trim());
}

export function markSeen(memoryId: number) {
  getDb().prepare("UPDATE memories SET last_seen_at = CURRENT_TIMESTAMP, growth = MIN(growth + 1, 5) WHERE id = ?").run(memoryId);
}

function listLinks() {
  return getDb().prepare(`
    SELECT
      memory_links.id,
      memory_links.source_id as sourceId,
      memory_links.target_id as targetId,
      memory_links.note,
      source.title as sourceTitle,
      target.title as targetTitle
    FROM memory_links
    JOIN memories source ON source.id = memory_links.source_id
    JOIN memories target ON target.id = memory_links.target_id
    ORDER BY memory_links.created_at DESC
  `).all() as MemoryLink[];
}

function dayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
