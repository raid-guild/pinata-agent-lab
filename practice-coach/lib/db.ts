import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Goal = {
  id: number;
  discipline: string;
  title: string;
  targetMinutes: number;
  focus: string;
  cadence: string;
  currentStreak: number;
  bestStreak: number;
  nextDrill: string;
  nextSessionDate: string;
};

export type Session = {
  id: number;
  goalId: number;
  minutes: number;
  drill: string;
  reflection: string;
  practicedOn: string;
  createdAt: string;
};

export type Plan = {
  id: number;
  goalId: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "practice-coach.sqlite");

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
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline TEXT NOT NULL,
      title TEXT NOT NULL,
      target_minutes INTEGER NOT NULL DEFAULT 30,
      focus TEXT NOT NULL DEFAULT '',
      cadence TEXT NOT NULL DEFAULT 'daily',
      current_streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      next_drill TEXT NOT NULL DEFAULT '',
      next_session_date TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      drill TEXT NOT NULL,
      reflection TEXT NOT NULL,
      practiced_on TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as count FROM goals").get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const insertGoal = database.prepare(`
    INSERT INTO goals (discipline, title, target_minutes, focus, cadence, current_streak, best_streak, next_drill, next_session_date)
    VALUES (@discipline, @title, @targetMinutes, @focus, @cadence, @currentStreak, @bestStreak, @nextDrill, @nextSessionDate)
  `);
  const insertSession = database.prepare(`
    INSERT INTO sessions (goal_id, minutes, drill, reflection, practiced_on, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertPlan = database.prepare(`
    INSERT INTO plans (goal_id, title, body, status, created_at)
    VALUES (?, ?, ?, 'draft', ?)
  `);

  const goals = [
    {
      discipline: "Guitar",
      title: "Clean chord changes at 96 BPM",
      targetMinutes: 35,
      focus: "Timing and relaxed transitions",
      cadence: "daily",
      currentStreak: 4,
      bestStreak: 9,
      nextDrill: "Five-minute warmup, G-C-D transitions, then metronome eighth notes at 92 BPM.",
      nextSessionDate: todayOffset(0),
      sessions: [
        {
          minutes: 32,
          drill: "G-C-D transition ladder",
          reflection: "Better accuracy after slowing the first two rounds. Tension returned above 94 BPM.",
          practicedOn: todayOffset(-1)
        },
        {
          minutes: 28,
          drill: "Metronome eighth notes",
          reflection: "Kept time clean at 90 BPM. Need a lighter fretting hand before increasing speed.",
          practicedOn: todayOffset(-2)
        }
      ],
      plan: "Start at 88 BPM for two clean passes, increase by 2 BPM only after relaxed transitions, then record one final take."
    },
    {
      discipline: "Writing",
      title: "Draft one sharp essay section",
      targetMinutes: 45,
      focus: "Clear argument and concrete examples",
      cadence: "weekdays",
      currentStreak: 2,
      bestStreak: 6,
      nextDrill: "Outline three claims, write one rough section, then cut the weakest paragraph.",
      nextSessionDate: todayOffset(1),
      sessions: [
        {
          minutes: 40,
          drill: "Argument outline",
          reflection: "The middle claim is strongest. Opening still reads too broad.",
          practicedOn: todayOffset(-1)
        }
      ],
      plan: "Use the strongest middle claim as the opener, write for 25 minutes, then spend 10 minutes trimming abstractions."
    },
    {
      discipline: "Spanish",
      title: "Hold a five-minute food conversation",
      targetMinutes: 25,
      focus: "Listening recall and restaurant phrases",
      cadence: "daily",
      currentStreak: 1,
      bestStreak: 5,
      nextDrill: "Shadow a short ordering dialogue and answer five recall prompts aloud.",
      nextSessionDate: todayOffset(0),
      sessions: [
        {
          minutes: 22,
          drill: "Dialogue shadowing",
          reflection: "Pronunciation felt smoother, but I missed numbers when the speaker sped up.",
          practicedOn: todayOffset(-3)
        }
      ],
      plan: "Replay the dialogue at normal speed, pause after each price, and repeat the full sentence before checking transcript."
    }
  ];

  const transaction = database.transaction(() => {
    for (const goal of goals) {
      const result = insertGoal.run(goal);
      const goalId = Number(result.lastInsertRowid);
      for (const session of goal.sessions) {
        insertSession.run(goalId, session.minutes, session.drill, session.reflection, session.practicedOn, `${session.practicedOn} 08:30:00`);
      }
      insertPlan.run(goalId, `Next ${goal.discipline} session`, goal.plan, `${todayOffset(0)} 07:45:00`);
    }
  });

  transaction();
}

export function listGoals() {
  const database = getDb();
  return database.prepare(`
    SELECT
      id,
      discipline,
      title,
      target_minutes as targetMinutes,
      focus,
      cadence,
      current_streak as currentStreak,
      best_streak as bestStreak,
      next_drill as nextDrill,
      next_session_date as nextSessionDate
    FROM goals
    ORDER BY next_session_date ASC, id ASC
  `).all() as Goal[];
}

export function getPracticeBundle(goalId?: number) {
  const goals = listGoals();
  const selected = goals.find((goal) => goal.id === goalId) ?? goals[0] ?? null;
  const selectedId = selected?.id ?? 0;
  const database = getDb();

  return {
    goals,
    selected,
    sessions: database
      .prepare(`
        SELECT id, goal_id as goalId, minutes, drill, reflection, practiced_on as practicedOn, created_at as createdAt
        FROM sessions
        WHERE goal_id = ?
        ORDER BY practiced_on DESC, created_at DESC
      `)
      .all(selectedId) as Session[],
    plans: database
      .prepare("SELECT id, goal_id as goalId, title, body, status, created_at as createdAt FROM plans WHERE goal_id = ? ORDER BY created_at DESC")
      .all(selectedId) as Plan[],
    dueGoals: goals.filter((goal) => goal.nextSessionDate <= todayOffset(0))
  };
}

export function addSession(goalId: number, minutes: number, drill: string, reflection: string, nextDrill: string, nextSessionDate: string) {
  const cleanDrill = drill.trim();
  const cleanReflection = reflection.trim();
  if (!cleanDrill || !cleanReflection) {
    throw new Error("Drill and reflection are required.");
  }

  const database = getDb();
  const transaction = database.transaction(() => {
    database
      .prepare("INSERT INTO sessions (goal_id, minutes, drill, reflection, practiced_on, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
      .run(goalId, Math.max(1, Math.round(minutes)), cleanDrill, cleanReflection, todayOffset(0));
    database
      .prepare(`
        UPDATE goals
        SET next_drill = ?, next_session_date = ?, current_streak = current_streak + 1, best_streak = MAX(best_streak, current_streak + 1)
        WHERE id = ?
      `)
      .run(nextDrill.trim(), nextSessionDate, goalId);
  });

  transaction();
}

export function addPlan(goalId: number, body: string) {
  const goal = listGoals().find((item) => item.id === goalId);
  if (!goal) {
    throw new Error("Goal not found.");
  }

  const cleanBody = body.trim();
  if (!cleanBody) {
    throw new Error("Plan body is required.");
  }

  getDb()
    .prepare("INSERT INTO plans (goal_id, title, body, status, created_at) VALUES (?, ?, ?, 'draft', CURRENT_TIMESTAMP)")
    .run(goalId, `Next ${goal.discipline} session`, cleanBody);
}

function todayOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
