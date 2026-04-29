"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    source: "",
    sourceType: "Interview",
    body: "",
    quote: "",
    tags: "",
    theme: "",
    followUp: ""
  });

  useEffect(() => {
    loadBundle(sourceFilter, tagFilter);
  }, [sourceFilter, tagFilter]);

  const activeNotes = bundle.notes;
  const sourceTypes = useMemo(() => Array.from(new Set(activeNotes.map((note) => note.sourceType).filter(Boolean))), [activeNotes]);

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

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const response = await fetch("/app/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setBundle((await response.json()) as Bundle);
      setSourceFilter("");
      setTagFilter("");
      setForm({
        title: "",
        source: "",
        sourceType: "Interview",
        body: "",
        quote: "",
        tags: "",
        theme: "",
        followUp: ""
      });
    }

    setIsSaving(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Research notebook</p>
          <h1>Field Notes</h1>
        </div>
        <div className="metrics" aria-label="Research counts">
          <span><strong>{bundle.notes.length}</strong> notes</span>
          <span><strong>{bundle.themes.length}</strong> themes</span>
          <span><strong>{sourceTypes.length}</strong> source types</span>
        </div>
      </header>

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

        <section className="panel capture">
          <div className="detailHead">
            <div>
              <p className="eyebrow">Capture</p>
              <h2>New observation</h2>
            </div>
          </div>

          <form className="form" onSubmit={submitNote}>
            <div className="formRow">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Short signal name" />
              </label>
              <label>
                Source
                <input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Call, chat, interview, session" />
              </label>
            </div>
            <div className="formRow">
              <label>
                Source type
                <select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}>
                  <option>Interview</option>
                  <option>Call</option>
                  <option>Discord</option>
                  <option>Fieldwork</option>
                  <option>Desk research</option>
                </select>
              </label>
              <label>
                Theme
                <input value={form.theme} onChange={(event) => setForm({ ...form, theme: event.target.value })} placeholder="Emerging theme" />
              </label>
            </div>
            <label>
              Observation
              <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="What happened, what changed, or what pattern showed up?" />
            </label>
            <label>
              Quote
              <textarea value={form.quote} onChange={(event) => setForm({ ...form, quote: event.target.value })} placeholder="Paste the most report-ready line." />
            </label>
            <div className="formRow">
              <label>
                Tags
                <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="comma, separated, tags" />
              </label>
              <label>
                Follow-up question
                <input value={form.followUp} onChange={(event) => setForm({ ...form, followUp: event.target.value })} placeholder="What should be asked next?" />
              </label>
            </div>
            <button disabled={isSaving || !form.body.trim()} type="submit">Save note</button>
          </form>

          <div className="timeline">
            <h3>Notes</h3>
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
                <div className="chips">
                  {note.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {note.followUp ? <p className="question">{note.followUp}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="sideStack">
          <section className="panel">
            <h2>Summary draft</h2>
            <pre className="summaryDraft">{bundle.summary}</pre>
          </section>

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
