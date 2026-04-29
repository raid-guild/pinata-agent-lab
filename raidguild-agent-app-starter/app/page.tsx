"use client";

import { useEffect, useMemo, useState } from "react";

type Todo = {
  id: number;
  title: string;
  body: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

type Bundle = {
  todos: Todo[];
  stats: {
    total: number;
    open: number;
    doing: number;
    done: number;
    highPriority: number;
  };
};

const emptyBundle: Bundle = {
  todos: [],
  stats: {
    total: 0,
    open: 0,
    doing: 0,
    done: 0,
    highPriority: 0
  }
};

const filters = ["all", "open", "doing", "done"];

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadBundle(filter);
  }, [filter]);

  const completion = useMemo(() => {
    return bundle.stats.total ? Math.round((bundle.stats.done / bundle.stats.total) * 100) : 0;
  }, [bundle.stats.done, bundle.stats.total]);

  async function loadBundle(nextFilter: string) {
    const suffix = nextFilter === "all" ? "" : `?status=${nextFilter}`;
    const response = await fetch(`/app/api/todos${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Pinata agent app starter</p>
          <h1>RaidGuild Agent App Starter</h1>
          <p>
            A small deployable pattern for a read-only dashboard, SQLite CRUD API, optional password auth,
            and optional OpenClaw response/webhook proxy routes.
          </p>
        </div>

        <div className="progressCard" aria-label="Todo completion">
          <span>Starter progress</span>
          <strong>{completion}%</strong>
          <div className="progressBar"><span style={{ width: `${completion}%` }} /></div>
          <em>{bundle.stats.done} of {bundle.stats.total} complete</em>
        </div>
      </section>

      <section className="featureGrid" aria-label="Starter features">
        <article>
          <span>01</span>
          <strong>Next.js app route</strong>
          <p>Public `/app` dashboard with stable Pinata route config.</p>
        </article>
        <article>
          <span>02</span>
          <strong>SQLite CRUD</strong>
          <p>Local database, seed data, list/create/update/delete API routes.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Optional auth</strong>
          <p>`APP_PASSWORD` protects `/app` and app APIs when set.</p>
        </article>
        <article>
          <span>04</span>
          <strong>OpenClaw proxy</strong>
          <p>`API_PASSWORD` enables response and webhook relays when needed.</p>
        </article>
      </section>

      <section className="workspace">
        <aside className="controlPanel">
          <div className="sectionHead">
            <h2>Todo API demo</h2>
            <span>{bundle.stats.total} records</span>
          </div>

          <div className="filterStack" aria-label="Todo filters">
            {filters.map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <div className="statStack">
            <span><strong>{bundle.stats.open}</strong> open</span>
            <span><strong>{bundle.stats.doing}</strong> doing</span>
            <span><strong>{bundle.stats.highPriority}</strong> high priority</span>
          </div>
        </aside>

        <section className="todoBoard" aria-label="Read-only todo dashboard">
          {bundle.todos.map((todo) => (
            <article className={`todoCard priority-${todo.priority}`} key={todo.id}>
              <div className="todoTop">
                <span>{todo.status}</span>
                <em>{todo.priority}</em>
              </div>
              <h2>{todo.title}</h2>
              <p>{todo.body}</p>
              <footer>
                <time>Due {todo.dueDate || "unscheduled"}</time>
                <small>Updated {formatDate(todo.updatedAt)}</small>
              </footer>
            </article>
          ))}
          {bundle.todos.length === 0 ? <p className="empty">No todos match this filter.</p> : null}
        </section>
      </section>

      <section className="apiStrip" aria-label="Useful API routes">
        <code>GET /app/api/todos</code>
        <code>POST /app/api/todos</code>
        <code>PATCH /app/api/todos/:id</code>
        <code>DELETE /app/api/todos/:id</code>
        <code>POST /app/api/openclaw/responses</code>
        <code>POST /app/api/openclaw/hooks/:name</code>
      </section>

      <footer className="cohortFooter">built by the RaidGuild cohort</footer>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
