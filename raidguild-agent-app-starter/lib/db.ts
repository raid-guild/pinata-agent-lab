import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Todo = {
  id: number;
  title: string;
  body: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

type TodoInput = {
  title?: string;
  body?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "starter.sqlite");
const statuses = new Set(["open", "doing", "done"]);
const priorities = new Set(["low", "normal", "high"]);

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
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM todos").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insert = database.prepare(`
    INSERT INTO todos (title, body, status, priority, due_date, created_at, updated_at)
    VALUES (@title, @body, @status, @priority, @dueDate, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const todos = [
    {
      title: "Read the workspace docs",
      body: "Start with BOOTSTRAP.md, IDENTITY.md, and OPERATIONS.md before changing behavior.",
      status: "open",
      priority: "high",
      dueDate: todayOffset(0)
    },
    {
      title: "Create a domain model",
      body: "Replace the todo schema with the records your agent app should actually manage.",
      status: "doing",
      priority: "normal",
      dueDate: todayOffset(1)
    },
    {
      title: "Keep the dashboard read-only",
      body: "Use the browser as a status surface and let chat/API calls perform writes.",
      status: "done",
      priority: "normal",
      dueDate: todayOffset(-1)
    }
  ];

  const transaction = database.transaction(() => {
    for (const todo of todos) {
      insert.run(todo);
    }
  });

  transaction();
}

export function listTodos(status?: string) {
  const database = getDb();
  const cleanStatus = status && statuses.has(status) ? status : undefined;
  const query = `
    SELECT
      id,
      title,
      body,
      status,
      priority,
      due_date as dueDate,
      created_at as createdAt,
      updated_at as updatedAt
    FROM todos
    ${cleanStatus ? "WHERE status = ?" : ""}
    ORDER BY
      CASE status WHEN 'doing' THEN 1 WHEN 'open' THEN 2 ELSE 3 END,
      CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      due_date ASC,
      updated_at DESC
  `;

  return (cleanStatus ? database.prepare(query).all(cleanStatus) : database.prepare(query).all()) as Todo[];
}

export function getTodoBundle(status?: string) {
  const todos = listTodos(status);
  const allTodos = listTodos();

  return {
    todos,
    stats: {
      total: allTodos.length,
      open: allTodos.filter((todo) => todo.status === "open").length,
      doing: allTodos.filter((todo) => todo.status === "doing").length,
      done: allTodos.filter((todo) => todo.status === "done").length,
      highPriority: allTodos.filter((todo) => todo.priority === "high" && todo.status !== "done").length
    }
  };
}

export function createTodo(input: TodoInput) {
  const database = getDb();
  const title = input.title?.trim();
  if (!title) {
    throw new Error("title is required");
  }

  const status = normalizeStatus(input.status);
  const priority = normalizePriority(input.priority);
  const result = database
    .prepare(`
      INSERT INTO todos (title, body, status, priority, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    .run(title, input.body?.trim() ?? "", status, priority, input.dueDate?.trim() ?? "");

  return getTodo(Number(result.lastInsertRowid));
}

export function updateTodo(id: number, input: TodoInput) {
  const existing = getTodo(id);
  if (!existing) {
    throw new Error("todo not found");
  }

  const title = input.title === undefined ? existing.title : input.title.trim();
  if (!title) {
    throw new Error("title cannot be blank");
  }

  const database = getDb();
  database
    .prepare(`
      UPDATE todos
      SET title = ?, body = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(
      title,
      input.body === undefined ? existing.body : input.body.trim(),
      normalizeStatus(input.status ?? existing.status),
      normalizePriority(input.priority ?? existing.priority),
      input.dueDate === undefined ? existing.dueDate : input.dueDate.trim(),
      id
    );

  return getTodo(id);
}

export function deleteTodo(id: number) {
  const database = getDb();
  const result = database.prepare("DELETE FROM todos WHERE id = ?").run(id);
  if (result.changes === 0) {
    throw new Error("todo not found");
  }
}

function getTodo(id: number) {
  return getDb()
    .prepare(`
      SELECT
        id,
        title,
        body,
        status,
        priority,
        due_date as dueDate,
        created_at as createdAt,
        updated_at as updatedAt
      FROM todos
      WHERE id = ?
    `)
    .get(id) as Todo | undefined;
}

function normalizeStatus(value?: string) {
  const status = value?.trim().toLowerCase() || "open";
  return statuses.has(status) ? status : "open";
}

function normalizePriority(value?: string) {
  const priority = value?.trim().toLowerCase() || "normal";
  return priorities.has(priority) ? priority : "normal";
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
