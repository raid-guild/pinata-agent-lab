"use client";

import { useEffect, useMemo, useState } from "react";

type FieldNote = {
  id: number;
  title: string;
  source: string;
  sourceType: string;
  body: string;
  quote: string;
  tags: string;
  theme: string;
  followUp: string;
  createdAt: string;
};

type Theme = {
  name: string;
  noteCount: number;
  latestSignal: string;
};

type Bundle = {
  notes: FieldNote[];
  themes: Theme[];
  sources: string[];
  tags: string[];
  summary: string;
};

const emptyBundle: Bundle = {
  notes: [],
  themes: [],
  sources: [],
  tags: [],
  summary: ""
};

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [sourceFilter, setSourceFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    loadBundle(sourceFilter, tagFilter);
  }, [sourceFilter, tagFilter]);

  const activeNotes = bundle.notes;
  const sourceCoverage = useMemo(() => {
    const counts = activeNotes.reduce<Record<string, number>>((next, note) => {
      const key = note.sourceType || "Unsorted";
      next[key] = (next[key] ?? 0) + 1;
      return next;
    }, {});
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([sourceType, count]) => ({
      count,
      sourceType,
      width: `${Math.max(14, (count / max) * 100)}%`
    }));
  }, [activeNotes]);
  const quoteCount = activeNotes.filter((note) => note.quote).length;
  const questionCount = activeNotes.filter((note) => note.followUp).length;

  async function loadBundle(source: string, tag: string) {
    const params = new URLSearchParams();
    if (source) {
      params.set("source", source);
    }
    if (tag) {
      params.set("tag", tag);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/app/api/research${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  return (
    <main className="shell">
      <section className="masthead">
        <div>
          <p className="eyebrow">Evidence desk</p>
          <h1>Field Notes Research</h1>
        </div>
        <div className="deskStats" aria-label="Research counts">
          <span><strong>{bundle.notes.length}</strong> notes</span>
          <span><strong>{bundle.themes.length}</strong> themes</span>
          <span><strong>{sourceCoverage.length}</strong> source types</span>
          <span><strong>{quoteCount}</strong> quotes</span>
        </div>
      </section>

      <section className="memo" aria-label="Working synthesis">
        <div className="memoStamp">Working synthesis</div>
        <pre>{bundle.summary}</pre>
        <div className="memoFooter">
          <span>{questionCount} open questions</span>
          <span>{bundle.sources.length} sources indexed</span>
        </div>
      </section>

      <section className="filterTape" aria-label="Research filters">
        <button className={!sourceFilter && !tagFilter ? "active" : ""} onClick={() => { setSourceFilter(""); setTagFilter(""); }} type="button">
          All evidence
        </button>
        {bundle.sources.map((source) => (
          <button
            className={sourceFilter === source ? "active source" : "source"}
            key={source}
            onClick={() => setSourceFilter(sourceFilter === source ? "" : source)}
            type="button"
          >
            {source}
          </button>
        ))}
        {bundle.tags.map((tag) => (
          <button
            className={tagFilter === tag ? "active tag" : "tag"}
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
            type="button"
          >
            #{tag}
          </button>
        ))}
      </section>

      <section className="deskGrid">
        <aside className="indexRail">
          <section className="coverage">
            <div className="sectionHead">
              <h2>Source coverage</h2>
              <span>{sourceCoverage.length}</span>
            </div>
            {sourceCoverage.map((item) => (
              <article key={item.sourceType}>
                <div>
                  <strong>{item.sourceType}</strong>
                  <span>{item.count} notes</span>
                </div>
                <div className="coverageBar"><span style={{ width: item.width }} /></div>
              </article>
            ))}
          </section>

          <section className="themeIndex">
            <div className="sectionHead">
              <h2>Theme index</h2>
              <span>{bundle.themes.length}</span>
            </div>
            {bundle.themes.map((theme, index) => (
              <article className={`tab-${index % 4}`} key={theme.name}>
                <strong>{theme.name}</strong>
                <span>{theme.noteCount} notes</span>
                <time>{formatDate(theme.latestSignal)}</time>
              </article>
            ))}
          </section>
        </aside>

        <section className="evidenceBoard" aria-label="Evidence notes">
          {activeNotes.map((note) => (
            <article className="evidenceCard" key={note.id}>
              <div className="noteStamp">
                <span>{note.sourceType || "Source"}</span>
                <time>{formatDate(note.createdAt)}</time>
              </div>
              <h2>{note.title}</h2>
              <p className="sourceLine">{note.source}</p>
              <p>{note.body}</p>
              {note.quote ? <blockquote>{note.quote}</blockquote> : null}
              {note.theme ? <strong className="themeTag">{note.theme}</strong> : null}
              <div className="chips">
                {note.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {note.followUp ? <p className="question">Open thread: {note.followUp}</p> : null}
            </article>
          ))}
          {activeNotes.length === 0 ? <p className="empty">No notes match the selected filters.</p> : null}
        </section>

        <aside className="questionRail">
          <div className="sectionHead">
            <h2>Open threads</h2>
            <span>{questionCount}</span>
          </div>
          {activeNotes.filter((note) => note.followUp).map((note) => (
            <article key={note.id}>
              <strong>{note.theme}</strong>
              <p>{note.followUp}</p>
            </article>
          ))}
        </aside>
      </section>

      <footer className="cohortFooter">
        <a href="https://www.raidguild.org/join" rel="noreferrer" target="_blank">
          <img alt="" src="https://www.brand.raidguild.org/assets/logos/symbol-m500.svg" />
          <span>built by the RaidGuild cohort</span>
        </a>
      </footer>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
