"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [minutes, setMinutes] = useState(30);
  const [drill, setDrill] = useState("");
  const [reflection, setReflection] = useState("");
  const [nextDrill, setNextDrill] = useState("");
  const [nextSessionDate, setNextSessionDate] = useState(today());
  const [plan, setPlan] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (bundle.selected) {
      setMinutes(bundle.selected.targetMinutes);
      setDrill(bundle.selected.nextDrill);
      setNextDrill(bundle.selected.nextDrill);
      setNextSessionDate(bundle.selected.nextSessionDate || today());
      setPlan(`${bundle.selected.targetMinutes} minutes for ${bundle.selected.discipline}:\n\n1. Warm up for 5 minutes.\n2. Work the focus: ${bundle.selected.focus}.\n3. Close by writing one adjustment for the next session.`);
    }
  }, [bundle.selected]);

  const selectedGoal = bundle.selected;
  const totals = useMemo(() => {
    const minutesLogged = bundle.sessions.reduce((sum, session) => sum + session.minutes, 0);
    return {
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

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGoal) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: selectedGoal.id,
        minutes,
        drill,
        reflection,
        nextDrill,
        nextSessionDate
      })
    });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    setReflection("");
    setIsSaving(false);
  }

  async function savePlan() {
    if (!selectedGoal) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: selectedGoal.id, body: plan })
    });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    setIsSaving(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Skill-building companion</p>
          <h1>Practice Coach</h1>
        </div>
        <div className="metrics" aria-label="Selected goal progress">
          <span><strong>{selectedGoal?.currentStreak ?? 0}</strong> day streak</span>
          <span><strong>{selectedGoal?.bestStreak ?? 0}</strong> best</span>
          <span><strong>{totals.minutesLogged}</strong> min logged</span>
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

              <div className="nextDrill">
                <span>Suggested next drill</span>
                <strong>{selectedGoal.nextDrill || "Choose a focused drill before the next session."}</strong>
                <time>{selectedGoal.nextSessionDate || "Unscheduled"}</time>
              </div>

              <form className="form" onSubmit={submitSession}>
                <div className="formRow">
                  <label>
                    Minutes
                    <input min="1" type="number" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
                  </label>
                  <label>
                    Next session
                    <input type="date" value={nextSessionDate} onChange={(event) => setNextSessionDate(event.target.value)} />
                  </label>
                </div>
                <label>
                  Drill practiced
                  <input value={drill} onChange={(event) => setDrill(event.target.value)} placeholder="Name the exercise, prompt, workout, or focus block." />
                </label>
                <label>
                  Reflection
                  <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What improved, what resisted, and what should change next time?" />
                </label>
                <label>
                  Next drill
                  <textarea value={nextDrill} onChange={(event) => setNextDrill(event.target.value)} />
                </label>
                <button disabled={isSaving || !drill.trim() || !reflection.trim()} type="submit">Log session</button>
              </form>

              <div className="timeline">
                <h3>Recent sessions ({totals.sessionCount})</h3>
                {bundle.sessions.map((item) => (
                  <article key={item.id}>
                    <time>{formatDate(item.practicedOn)}</time>
                    <strong>{item.minutes} min · {item.drill}</strong>
                    <p>{item.reflection}</p>
                  </article>
                ))}
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
              <span>{bundle.dueGoals.length}</span>
            </div>
            <div className="dueList">
              {bundle.dueGoals.map((goal) => (
                <button key={goal.id} onClick={() => setSelectedId(goal.id)} type="button">
                  <strong>{goal.discipline}</strong>
                  <span>{goal.nextDrill}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Next session plan</h2>
            <textarea className="planBox" value={plan} onChange={(event) => setPlan(event.target.value)} />
            <button disabled={isSaving || !plan.trim()} onClick={savePlan} type="button">Store plan</button>
            <div className="plans">
              {bundle.plans.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
