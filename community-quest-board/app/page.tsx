"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type QuestStatus = "open" | "claimed" | "review" | "done";

type Quest = {
  id: number;
  title: string;
  summary: string;
  status: QuestStatus;
  owner: string;
  outcome: string;
  dueDate: string;
  points: number;
};

type QuestUpdate = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
};

type Bundle = {
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

const emptyBundle: Bundle = {
  quests: [],
  selected: null,
  updates: [],
  recap: {
    completed: [],
    inFlight: [],
    open: [],
    pointsShipped: 0,
    highlights: []
  }
};

const statuses: QuestStatus[] = ["open", "claimed", "review", "done"];

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [author, setAuthor] = useState("Steward");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<QuestStatus>("open");
  const [owner, setOwner] = useState("");
  const [outcome, setOutcome] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (bundle.selected) {
      setStatus(bundle.selected.status);
      setOwner(bundle.selected.owner);
      setOutcome(bundle.selected.outcome);
    }
  }, [bundle.selected]);

  const selectedQuest = bundle.selected;
  const columns = useMemo(() => {
    return statuses.map((item) => ({
      status: item,
      quests: bundle.quests.filter((quest) => quest.status === item)
    }));
  }, [bundle.quests]);

  async function loadBundle(questId: number | null) {
    const suffix = questId ? `?questId=${questId}` : "";
    const response = await fetch(`/app/api/quests${suffix}`, { cache: "no-store" });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    if (!questId && nextBundle.selected) {
      setSelectedId(nextBundle.selected.id);
    }
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuest) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questId: selectedQuest.id,
        author,
        body,
        status,
        owner,
        outcome
      })
    });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    setBody("");
    setIsSaving(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Guild coordination</p>
          <h1>Community Quest Board</h1>
        </div>
        <div className="metrics" aria-label="Weekly metrics">
          <span><strong>{bundle.recap.pointsShipped}</strong> points shipped</span>
          <span><strong>{bundle.recap.inFlight.length}</strong> in flight</span>
          <span><strong>{bundle.recap.open.length}</strong> open</span>
        </div>
      </header>

      <section className="board" aria-label="Quest board columns">
        {columns.map((column) => (
          <section className="column" key={column.status}>
            <div className="columnHeader">
              <h2>{column.status}</h2>
              <span>{column.quests.length}</span>
            </div>
            <div className="questList">
              {column.quests.map((quest) => (
                <button
                  className={quest.id === selectedQuest?.id ? "quest active" : "quest"}
                  key={quest.id}
                  onClick={() => setSelectedId(quest.id)}
                  type="button"
                >
                  <span className="questTop">
                    <strong>{quest.title}</strong>
                    <em>{quest.points} pt</em>
                  </span>
                  <span>{quest.summary}</span>
                  <span className="questMeta">
                    <small>{quest.owner || "Unclaimed"}</small>
                    <time>{formatDate(quest.dueDate)}</time>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="workspace">
        <section className="panel detail">
          {selectedQuest ? (
            <>
              <div className="detailHead">
                <div>
                  <p className="eyebrow">{selectedQuest.status}</p>
                  <h2>{selectedQuest.title}</h2>
                  <p>{selectedQuest.summary}</p>
                </div>
                <span className="status">{selectedQuest.owner || "Unclaimed"}</span>
              </div>

              <div className="outcome">
                <span>Outcome</span>
                <strong>{selectedQuest.outcome || "No outcome recorded yet."}</strong>
              </div>

              <form className="form" onSubmit={submitUpdate}>
                <div className="formRow">
                  <label>
                    Owner
                    <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Name or team" />
                  </label>
                  <label>
                    Status
                    <select value={status} onChange={(event) => setStatus(event.target.value as QuestStatus)}>
                      {statuses.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Update
                  <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share progress, blockers, asks, or review notes." />
                </label>
                <label>
                  Outcome
                  <textarea className="short" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Capture the shipped result when the quest closes." />
                </label>
                <div className="formRow">
                  <label>
                    Author
                    <input value={author} onChange={(event) => setAuthor(event.target.value)} />
                  </label>
                  <button disabled={isSaving || !body.trim()} type="submit">Save update</button>
                </div>
              </form>

              <div className="timeline">
                <h3>Updates</h3>
                {bundle.updates.map((item) => (
                  <article key={item.id}>
                    <time>{formatDate(item.createdAt)}</time>
                    <strong>{item.author}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>No quests yet.</p>
          )}
        </section>

        <aside className="panel recap">
          <div className="panelHeader">
            <h2>Weekly recap</h2>
            <span>{bundle.recap.completed.length} done</span>
          </div>
          <div className="recapBlock">
            <h3>Shipped</h3>
            {bundle.recap.completed.map((quest) => (
              <article key={quest.id}>
                <strong>{quest.title}</strong>
                <p>{quest.outcome}</p>
              </article>
            ))}
          </div>
          <div className="recapBlock">
            <h3>Next asks</h3>
            {bundle.recap.open.slice(0, 3).map((quest) => (
              <button key={quest.id} onClick={() => setSelectedId(quest.id)} type="button">
                <strong>{quest.title}</strong>
                <span>{quest.points} points available</span>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
