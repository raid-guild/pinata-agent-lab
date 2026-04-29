"use client";

import { useEffect, useMemo, useState } from "react";

type Goal = {
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

type Session = {
  id: number;
  minutes: number;
  drill: string;
  reflection: string;
  practicedOn: string;
  createdAt: string;
};

type Plan = {
  id: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

type Bundle = {
  goals: Goal[];
  selected: Goal | null;
  sessions: Session[];
  plans: Plan[];
  dueGoals: Goal[];
};

const emptyBundle: Bundle = {
  goals: [],
  selected: null,
  sessions: [],
  plans: [],
  dueGoals: []
};

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  const selectedGoal = bundle.selected;
  const totals = useMemo(() => {
    const minutesLogged = bundle.sessions.reduce((sum, session) => sum + session.minutes, 0);
    const averageMinutes = bundle.sessions.length > 0 ? Math.round(minutesLogged / bundle.sessions.length) : 0;
    return {
      averageMinutes,
      minutesLogged,
      sessionCount: bundle.sessions.length
    };
  }, [bundle.sessions]);

  async function loadBundle(goalId: number | null) {
    const suffix = goalId ? `?goalId=${goalId}` : "";
    const response = await fetch(`/app/api/practice${suffix}`, { cache: "no-store" });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    if (!goalId && nextBundle.selected) {
      setSelectedId(nextBundle.selected.id);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Read-only training status</p>
          <h1>Practice Coach</h1>
        </div>
        <div className="metrics" aria-label="Selected goal progress">
          <span><strong>{selectedGoal?.currentStreak ?? 0}</strong> day streak</span>
          <span><strong>{selectedGoal?.bestStreak ?? 0}</strong> best</span>
          <span><strong>{totals.minutesLogged}</strong> min logged</span>
          <span><strong>{totals.averageMinutes}</strong> avg min</span>
        </div>
      </header>

      <section className="grid">
        <aside className="panel goalList" aria-label="Practice goals">
          <div className="panelHeader">
            <h2>Goals</h2>
            <span>{bundle.goals.length}</span>
          </div>
          {bundle.goals.map((goal) => (
            <button
              className={goal.id === selectedGoal?.id ? "goal active" : "goal"}
              key={goal.id}
              onClick={() => setSelectedId(goal.id)}
              type="button"
            >
              <span>
                <strong>{goal.discipline}</strong>
                <small>{goal.title}</small>
              </span>
              <em>{goal.currentStreak}d</em>
            </button>
          ))}
        </aside>

        <section className="panel detail">
          {selectedGoal ? (
            <>
              <div className="detailHead">
                <div>
                  <p className="eyebrow">{selectedGoal.cadence} practice</p>
                  <h2>{selectedGoal.title}</h2>
                  <p>{selectedGoal.discipline} · {selectedGoal.focus}</p>
                </div>
                <span className="status">{selectedGoal.targetMinutes} min target</span>
              </div>

              <div className="trainingGrid" aria-label="Selected goal status">
                <div className="trainingMetric">
                  <span>Target</span>
                  <strong>{selectedGoal.targetMinutes} min</strong>
                  <time>{selectedGoal.cadence}</time>
                </div>
                <div className="trainingMetric">
                  <span>Streak</span>
                  <strong>{selectedGoal.currentStreak} days</strong>
                  <time>Best {selectedGoal.bestStreak}</time>
                </div>
                <div className="trainingMetric highlight">
                  <span>Due practice</span>
                  <strong>{selectedGoal.nextSessionDate || "Unscheduled"}</strong>
                  <time>{selectedGoal.nextDrill || "No drill queued"}</time>
                </div>
              </div>

              <div className="timeline">
                <div className="panelHeader">
                  <h3>Recent sessions</h3>
                  <span className="countTag">{totals.sessionCount}</span>
                </div>
                {bundle.sessions.length > 0 ? (
                  bundle.sessions.map((item) => (
                    <article key={item.id}>
                      <time>{formatDate(item.practicedOn)}</time>
                      <strong>{item.minutes} min · {item.drill}</strong>
                      <p>{item.reflection}</p>
                    </article>
                  ))
                ) : (
                  <p className="empty">No sessions logged for this goal.</p>
                )}
              </div>
            </>
          ) : (
            <p>No practice goals yet.</p>
          )}
        </section>

        <aside className="sideStack">
          <section className="panel">
            <div className="panelHeader">
              <h2>Due today</h2>
              <span className="countTag">{bundle.dueGoals.length}</span>
            </div>
            <div className="dueList">
              {bundle.dueGoals.length > 0 ? (
                bundle.dueGoals.map((goal) => (
                  <button key={goal.id} onClick={() => setSelectedId(goal.id)} type="button">
                    <strong>{goal.discipline}</strong>
                    <span>{goal.nextDrill}</span>
                    <time>{goal.nextSessionDate}</time>
                  </button>
                ))
              ) : (
                <p className="empty">No practice blocks are due today.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h2>Stored plans</h2>
              <span className="countTag">{bundle.plans.length}</span>
            </div>
            <div className="plans">
              {bundle.plans.length > 0 ? (
                bundle.plans.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <span className="tag">{item.status}</span>
                    </div>
                    <p>{item.body}</p>
                    <time>{formatDate(item.createdAt)}</time>
                  </article>
                ))
              ) : (
                <p className="empty">No next-session plans stored.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
