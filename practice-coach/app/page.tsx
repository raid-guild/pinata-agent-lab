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
    const longestSession = bundle.sessions.reduce((max, session) => Math.max(max, session.minutes), 0);
    return {
      averageMinutes,
      longestSession,
      minutesLogged,
      sessionCount: bundle.sessions.length
    };
  }, [bundle.sessions]);

  const streakProgress = selectedGoal?.bestStreak
    ? Math.min(100, Math.round((selectedGoal.currentStreak / selectedGoal.bestStreak) * 100))
    : 0;

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
      <section className="arenaHero">
        <div className="heroCopy">
          <p className="eyebrow">Training console</p>
          <h1>Practice Coach</h1>
          <p>Read-only practice telemetry for the drills, streaks, and next reps your coach agent keeps current.</p>
        </div>

        <section className="trainingDial" aria-label="Selected goal streak">
          <div className="dial" style={{ "--progress": `${streakProgress}%` } as React.CSSProperties}>
            <div>
              <strong>{selectedGoal?.currentStreak ?? 0}</strong>
              <span>day streak</span>
            </div>
          </div>
          <div className="dialMeta">
            <span>Best streak {selectedGoal?.bestStreak ?? 0}</span>
            <span>{totals.minutesLogged} minutes logged</span>
            <span>{totals.averageMinutes} min average</span>
          </div>
        </section>
      </section>

      <section className="goalTrack" aria-label="Practice goals">
        {bundle.goals.map((goal) => (
          <button
            className={goal.id === selectedGoal?.id ? "goalLane active" : "goalLane"}
            key={goal.id}
            onClick={() => setSelectedId(goal.id)}
            type="button"
          >
            <span>{goal.discipline}</span>
            <strong>{goal.title}</strong>
            <em>{goal.currentStreak}d streak</em>
          </button>
        ))}
      </section>

      <section className="practiceGrid">
        <section className="sessionArena">
          {selectedGoal ? (
            <>
              <div className="arenaHeader">
                <div>
                  <p className="eyebrow">{selectedGoal.cadence} practice</p>
                  <h2>{selectedGoal.title}</h2>
                  <p>{selectedGoal.discipline} / {selectedGoal.focus}</p>
                </div>
                <span>{selectedGoal.targetMinutes} min target</span>
              </div>

              <div className="cueCard">
                <span>Next drill</span>
                <strong>{selectedGoal.nextDrill || "No drill queued"}</strong>
                <time>{selectedGoal.nextSessionDate || "Unscheduled"}</time>
              </div>

              <div className="heatmap" aria-label="Recent practice intensity">
                {buildHeatmap(bundle.sessions).map((day) => (
                  <span
                    className={`heatCell level-${day.level}`}
                    key={day.label}
                    title={`${day.label}: ${day.minutes} minutes`}
                  >
                    {day.short}
                  </span>
                ))}
              </div>

              <section className="intervals" aria-label="Recent sessions">
                <div className="sectionHead">
                  <h3>Recent reps</h3>
                  <span>{totals.sessionCount} sessions</span>
                </div>
                {bundle.sessions.length > 0 ? (
                  bundle.sessions.map((item) => {
                    const width = totals.longestSession ? Math.max(18, (item.minutes / totals.longestSession) * 100) : 18;
                    return (
                      <article key={item.id}>
                        <div className="repTop">
                          <time>{formatDate(item.practicedOn)}</time>
                          <strong>{item.minutes} min</strong>
                        </div>
                        <div className="repBar"><span style={{ width: `${width}%` }} /></div>
                        <h4>{item.drill}</h4>
                        <p>{item.reflection}</p>
                      </article>
                    );
                  })
                ) : (
                  <p className="empty">No sessions logged for this goal.</p>
                )}
              </section>
            </>
          ) : (
            <p className="empty">No practice goals yet.</p>
          )}
        </section>

        <aside className="coachRail">
          <section className="dueBlocks">
            <div className="sectionHead">
              <h2>Due blocks</h2>
              <span>{bundle.dueGoals.length}</span>
            </div>
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
          </section>

          <section className="planDeck">
            <div className="sectionHead">
              <h2>Cue sheets</h2>
              <span>{bundle.plans.length}</span>
            </div>
            {bundle.plans.length > 0 ? (
              bundle.plans.map((item) => (
                <article key={item.id}>
                  <span>{item.status}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <time>{formatDate(item.createdAt)}</time>
                </article>
              ))
            ) : (
              <p className="empty">No next-session plans stored.</p>
            )}
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

function buildHeatmap(sessions: Session[]) {
  const now = new Date();
  const byDate = new Map<string, number>();
  for (const session of sessions) {
    byDate.set(session.practicedOn, (byDate.get(session.practicedOn) ?? 0) + session.minutes);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const minutes = byDate.get(key) ?? 0;
    return {
      label: formatDate(key),
      level: minutes >= 45 ? 3 : minutes >= 20 ? 2 : minutes > 0 ? 1 : 0,
      minutes,
      short: new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)
    };
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
