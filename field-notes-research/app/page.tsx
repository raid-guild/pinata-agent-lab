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
  const sourceTypes = useMemo(() => Array.from(new Set(activeNotes.map((note) => note.sourceType).filter(Boolean))), [activeNotes]);
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
      <header className="topbar">
        <div>
          <p className="eyebrow">Read-only research dossier</p>
          <h1>Field Notes Research</h1>
        </div>
        <div className="metrics" aria-label="Research counts">
          <span><strong>{bundle.notes.length}</strong> notes</span>
          <span><strong>{bundle.themes.length}</strong> themes</span>
          <span><strong>{sourceTypes.length}</strong> source types</span>
          <span><strong>{quoteCount}</strong> quotes</span>
        </div>
      </header>

      <section className="summaryBand" aria-label="Summary draft">
        <div>
          <p className="eyebrow">Working synthesis</p>
          <pre className="summaryDraft">{bundle.summary}</pre>
        </div>
        <div className="summaryStats">
          <span>{questionCount} open questions</span>
          <span>{bundle.sources.length} sources indexed</span>
        </div>
      </section>

      <section className="grid">
        <aside className="panel filterPanel" aria-label="Filters">
          <div className="panelHeader">
            <h2>Filters</h2>
            <button onClick={() => { setSourceFilter(""); setTagFilter(""); }} type="button">Clear</button>
          </div>

          <label>
            Source
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="">All sources</option>
              {bundle.sources.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </label>

          <label>
            Tag
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="">All tags</option>
              {bundle.tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>

          <div className="themeList">
            <h3>Theme board</h3>
            {bundle.themes.map((theme) => (
              <article key={theme.name}>
                <strong>{theme.name}</strong>
                <span>{theme.noteCount} notes</span>
                <time>{formatDate(theme.latestSignal)}</time>
              </article>
            ))}
          </div>
        </aside>

        <section className="panel dossier">
          <div className="detailHead">
            <div>
              <p className="eyebrow">Evidence file</p>
              <h2>Notes, quotes, and signals</h2>
            </div>
            <span className="status">Chat/API writes only</span>
          </div>

          <div className="timeline">
            {activeNotes.map((note) => (
              <article key={note.id}>
                <div className="noteHead">
                  <div>
                    <strong>{note.title}</strong>
                    <span>{note.source} · {note.sourceType}</span>
                  </div>
                  <time>{formatDate(note.createdAt)}</time>
                </div>
                <p>{note.body}</p>
                {note.quote ? <blockquote>{note.quote}</blockquote> : null}
                {note.theme ? <span className="themeTag">{note.theme}</span> : null}
                <div className="chips">
                  {note.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {note.followUp ? <p className="question">{note.followUp}</p> : null}
              </article>
            ))}
            {activeNotes.length === 0 ? <p className="empty">No notes match the selected filters.</p> : null}
          </div>
        </section>

        <aside className="sideStack">
          <section className="panel">
            <h2>Follow-up questions</h2>
            <div className="questionList">
              {activeNotes.filter((note) => note.followUp).map((note) => (
                <article key={note.id}>
                  <strong>{note.theme}</strong>
                  <p>{note.followUp}</p>
                </article>
              ))}
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
