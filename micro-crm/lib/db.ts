import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Contact = {
  id: number;
  name: string;
  company: string;
  role: string;
  email: string;
  status: string;
  nextAction: string;
  nextActionDate: string;
  lastContacted: string;
};

export type Note = {
  id: number;
  contactId: number;
  body: string;
  createdAt: string;
};

export type Draft = {
  id: number;
  contactId: number;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "micro-crm.sqlite");

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
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      next_action TEXT NOT NULL DEFAULT '',
      next_action_date TEXT NOT NULL DEFAULT '',
      last_contacted TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM contacts").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertContact = database.prepare(`
    INSERT INTO contacts (name, company, role, email, status, next_action, next_action_date, last_contacted)
    VALUES (@name, @company, @role, @email, @status, @nextAction, @nextActionDate, @lastContacted)
  `);
  const insertNote = database.prepare("INSERT INTO notes (contact_id, body, created_at) VALUES (?, ?, ?)");
  const insertDraft = database.prepare(
    "INSERT INTO drafts (contact_id, subject, body, status, created_at) VALUES (?, ?, ?, 'draft', ?)"
  );

  const contacts = [
    {
      name: "Avery Stone",
      company: "Northstar Studio",
      role: "Founder",
      email: "avery@example.com",
      status: "proposal",
      nextAction: "Send revised scope",
      nextActionDate: todayOffset(0),
      lastContacted: todayOffset(-3),
      note: "Asked for a smaller first milestone and clearer weekly reporting.",
      draft: "Draft a concise scope update with two milestone options and a Friday decision point."
    },
    {
      name: "Mina Patel",
      company: "Brightline Ops",
      role: "Operations Lead",
      email: "mina@example.com",
      status: "active",
      nextAction: "Check onboarding feedback",
      nextActionDate: todayOffset(1),
      lastContacted: todayOffset(-7),
      note: "Pilot is live with three internal users. Wants a simple handoff checklist.",
      draft: "Ask what felt unclear during onboarding and offer a 20 minute cleanup call."
    },
    {
      name: "Theo Kim",
      company: "Independent",
      role: "Consultant",
      email: "theo@example.com",
      status: "lead",
      nextAction: "Share case study",
      nextActionDate: todayOffset(0),
      lastContacted: todayOffset(-12),
      note: "Interested in a lightweight dashboard for recurring client work.",
      draft: "Send the closest case study and ask which workflow is most urgent this month."
    }
  ];

  const transaction = database.transaction(() => {
    for (const contact of contacts) {
      const result = insertContact.run(contact);
      const contactId = Number(result.lastInsertRowid);
      insertNote.run(contactId, contact.note, `${contact.lastContacted} 09:00:00`);
      insertDraft.run(contactId, `Follow up with ${contact.name.split(" ")[0]}`, contact.draft, `${todayOffset(0)} 08:00:00`);
    }
  });

  transaction();
}

export function listContacts() {
  const database = getDb();
  return database.prepare(`
    SELECT
      id,
      name,
      company,
      role,
      email,
      status,
      next_action as nextAction,
      next_action_date as nextActionDate,
      last_contacted as lastContacted
    FROM contacts
    ORDER BY
      CASE status
        WHEN 'active' THEN 1
        WHEN 'proposal' THEN 2
        WHEN 'lead' THEN 3
        ELSE 4
      END,
      next_action_date ASC
  `).all() as Contact[];
}

export function getContactBundle(contactId?: number) {
  const contacts = listContacts();
  const selected = contacts.find((contact) => contact.id === contactId) ?? contacts[0] ?? null;
  const selectedId = selected?.id ?? 0;
  const database = getDb();

  return {
    contacts,
    selected,
    notes: database
      .prepare("SELECT id, contact_id as contactId, body, created_at as createdAt FROM notes WHERE contact_id = ? ORDER BY created_at DESC")
      .all(selectedId) as Note[],
    drafts: database
      .prepare("SELECT id, contact_id as contactId, subject, body, status, created_at as createdAt FROM drafts WHERE contact_id = ? ORDER BY created_at DESC")
      .all(selectedId) as Draft[],
    followUps: contacts.filter((contact) => contact.nextActionDate <= todayOffset(0))
  };
}

export function addNote(contactId: number, body: string, nextAction: string, nextActionDate: string) {
  const database = getDb();
  const cleanBody = body.trim();
  if (!cleanBody) {
    throw new Error("Note is required.");
  }

  const transaction = database.transaction(() => {
    database.prepare("INSERT INTO notes (contact_id, body, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)").run(contactId, cleanBody);
    database
      .prepare("UPDATE contacts SET next_action = ?, next_action_date = ?, last_contacted = ? WHERE id = ?")
      .run(nextAction.trim(), nextActionDate, todayOffset(0), contactId);
  });

  transaction();
}

export function addDraft(contactId: number, body: string) {
  const contact = listContacts().find((item) => item.id === contactId);
  if (!contact) {
    throw new Error("Contact not found.");
  }

  const cleanBody = body.trim();
  if (!cleanBody) {
    throw new Error("Draft body is required.");
  }

  getDb()
    .prepare("INSERT INTO drafts (contact_id, subject, body, status, created_at) VALUES (?, ?, ?, 'draft', CURRENT_TIMESTAMP)")
    .run(contactId, `Follow up with ${contact.name.split(" ")[0]}`, cleanBody);
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
