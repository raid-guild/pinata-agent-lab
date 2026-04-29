"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  const selectedQuest = bundle.selected;
  const columns = useMemo(() => {
    return statuses.map((item) => ({
      status: item,
      quests: bundle.quests.filter((quest) => quest.status === item)
    }));
  }, [bundle.quests]);
  const totalPoints = useMemo(() => bundle.quests.reduce((sum, quest) => sum + quest.points, 0), [bundle.quests]);
  const shippedPercent = totalPoints ? Math.round((bundle.recap.pointsShipped / totalPoints) * 100) : 0;

  async function loadBundle(questId: number | null) {
    const suffix = questId ? `?questId=${questId}` : "";
    const response = await fetch(`/app/api/quests${suffix}`, { cache: "no-store" });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    if (!questId && nextBundle.selected) {
      setSelectedId(nextBundle.selected.id);
    }
  }

  return (
    <main className="shell">
      <section className="guildHeader">
        <div>
          <p className="eyebrow">Raid report</p>
          <h1>Community Quest Board</h1>
          <p>Read-only mission control for guild work, owners, outcomes, and weekly coordination.</p>
        </div>
        <div className="xpPanel" aria-label="Guild progress">
          <span>Guild XP</span>
          <strong>{bundle.recap.pointsShipped}/{totalPoints || 0}</strong>
          <div className="xpBar"><span style={{ width: `${Math.min(100, shippedPercent)}%` }} /></div>
          <em>{shippedPercent}% shipped</em>
        </div>
      </section>

      <section className="statusBanners" aria-label="Quest status counts">
        {columns.map((column) => (
          <button
            className={`banner ${column.status}`}
            key={column.status}
            onClick={() => column.quests[0] ? setSelectedId(column.quests[0].id) : undefined}
            type="button"
          >
            <span>{column.status}</span>
            <strong>{column.quests.length}</strong>
          </button>
        ))}
      </section>

      <section className="questMap" aria-label="Quest bounty board">
        {columns.map((column) => (
          <section className={`questZone ${column.status}`} key={column.status}>
            <div className="zoneHeader">
              <h2>{column.status}</h2>
              <span>{column.quests.reduce((sum, quest) => sum + quest.points, 0)} pts</span>
            </div>
            <div className="bounties">
              {column.quests.map((quest) => (
                <button
                  className={quest.id === selectedQuest?.id ? "bounty active" : "bounty"}
                  key={quest.id}
                  onClick={() => setSelectedId(quest.id)}
                  type="button"
                >
                  <span className="rank">{rankForPoints(quest.points)}</span>
                  <strong>{quest.title}</strong>
                  <span>{quest.summary}</span>
                  <span className="bountyMeta">
                    <em>{quest.points} pts</em>
                    <small>{quest.owner || "Unclaimed"}</small>
                    <time>{formatDate(quest.dueDate)}</time>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="missionGrid">
        <section className="briefing">
          {selectedQuest ? (
            <>
              <div className="briefingHead">
                <div>
                  <p className="eyebrow">{selectedQuest.status} mission</p>
                  <h2>{selectedQuest.title}</h2>
                  <p>{selectedQuest.summary}</p>
                </div>
                <span>{rankForPoints(selectedQuest.points)}</span>
              </div>

              <div className="questStats" aria-label="Selected quest status">
                <article>
                  <span>Owner</span>
                  <strong>{selectedQuest.owner || "Unclaimed"}</strong>
                </article>
                <article>
                  <span>Due</span>
                  <strong>{formatDate(selectedQuest.dueDate)}</strong>
                </article>
                <article>
                  <span>Reward</span>
                  <strong>{selectedQuest.points} pts</strong>
                </article>
              </div>

              <div className="outcome">
                <span>Outcome</span>
                <strong>{selectedQuest.outcome || "No outcome recorded yet."}</strong>
              </div>

              <div className="updates">
                <h3>Mission log</h3>
                {bundle.updates.length > 0 ? (
                  bundle.updates.map((item) => (
                    <article key={item.id}>
                      <time>{formatDate(item.createdAt)}</time>
                      <strong>{item.author}</strong>
                      <p>{item.body}</p>
                    </article>
                  ))
                ) : (
                  <p className="empty">No updates recorded for this quest.</p>
                )}
              </div>
            </>
          ) : (
            <p className="empty">No quests yet.</p>
          )}
        </section>

        <aside className="ledger">
          <div className="sectionHead">
            <h2>Guild ledger</h2>
            <span>{bundle.recap.completed.length} done</span>
          </div>
          <section>
            <h3>Shipped</h3>
            {bundle.recap.completed.length > 0 ? (
              bundle.recap.completed.map((quest) => (
                <article key={quest.id}>
                  <strong>{quest.title}</strong>
                  <p>{quest.outcome}</p>
                </article>
              ))
            ) : (
              <p className="empty">No completed quests yet.</p>
            )}
          </section>
          <section>
            <h3>Next asks</h3>
            {bundle.recap.open.slice(0, 3).map((quest) => (
              <button key={quest.id} onClick={() => setSelectedId(quest.id)} type="button">
                <strong>{quest.title}</strong>
                <span>{quest.points} points available</span>
              </button>
            ))}
          </section>
          <section>
            <h3>In flight</h3>
            {bundle.recap.inFlight.slice(0, 4).map((quest) => (
              <button key={quest.id} onClick={() => setSelectedId(quest.id)} type="button">
                <strong>{quest.title}</strong>
                <span>{quest.status} by {quest.owner || "unassigned"}</span>
              </button>
            ))}
          </section>
        </aside>
      </section>

      <footer className="cohortFooter">
        <a href="https://www.raidguild.org/join" rel="noreferrer" target="_blank">
          <img alt="" src="https://www.brand.raidguild.org/assets/logos/symbol-m800.svg" />
          <span>built by the RaidGuild cohort</span>
        </a>
      </footer>
    </main>
  );
}

function rankForPoints(points: number) {
  if (points >= 8) return "S";
  if (points >= 5) return "A";
  if (points >= 3) return "B";
  return "C";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
