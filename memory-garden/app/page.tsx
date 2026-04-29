"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Topic = {
  id: number;
  name: string;
  color: string;
  description: string;
  memoryCount: number;
  latestActivity: string;
};

type Memory = {
  id: number;
  title: string;
  body: string;
  topicId: number;
  topicName: string;
  topicColor: string;
  growth: number;
  lastSeenAt: string;
  createdAt: string;
};

type MemoryLink = {
  id: number;
  sourceId: number;
  targetId: number;
  note: string;
  sourceTitle: string;
  targetTitle: string;
};

type Bundle = {
  topics: Topic[];
  selectedTopic: Topic | null;
  memories: Memory[];
  allMemories: Memory[];
  links: MemoryLink[];
  resurfaced: Memory[];
};

const emptyBundle: Bundle = {
  topics: [],
  selectedTopic: null,
  memories: [],
  allMemories: [],
  links: [],
  resurfaced: []
};

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [growth, setGrowth] = useState(2);
  const [sourceId, setSourceId] = useState<number | "">("");
  const [targetId, setTargetId] = useState<number | "">("");
  const [linkNote, setLinkNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBundle(selectedTopicId);
  }, [selectedTopicId]);

  useEffect(() => {
    if (!selectedTopicId && bundle.selectedTopic) {
      setSelectedTopicId(bundle.selectedTopic.id);
    }
  }, [bundle.selectedTopic, selectedTopicId]);

  const selectedTopic = bundle.selectedTopic;
  const totalMemories = useMemo(() => bundle.topics.reduce((sum, topic) => sum + topic.memoryCount, 0), [bundle.topics]);

  async function loadBundle(topicId: number | null) {
    const suffix = topicId ? `?topicId=${topicId}` : "";
    const response = await fetch(`/app/api/memories${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  async function submitMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTopic) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, topicId: selectedTopic.id, growth })
    });
    setBundle((await response.json()) as Bundle);
    setTitle("");
    setBody("");
    setGrowth(2);
    setIsSaving(false);
  }

  async function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceId || !targetId) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, targetId, note: linkNote, topicId: selectedTopic?.id })
    });
    setBundle((await response.json()) as Bundle);
    setSourceId("");
    setTargetId("");
    setLinkNote("");
    setIsSaving(false);
  }

  async function markMemorySeen(memoryId: number) {
    setIsSaving(true);
    const response = await fetch("/app/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seenMemoryId: memoryId, topicId: selectedTopic?.id })
    });
    setBundle((await response.json()) as Bundle);
    setIsSaving(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal knowledge template</p>
          <h1>Memory Garden</h1>
        </div>
        <div className="metrics" aria-label="Garden totals">
          <span><strong>{bundle.topics.length}</strong> topics</span>
          <span><strong>{totalMemories}</strong> memories</span>
          <span><strong>{bundle.links.length}</strong> links</span>
        </div>
      </header>

      <section className="grid">
        <aside className="panel topics" aria-label="Topics">
          <div className="panelHeader">
            <h2>Topic garden</h2>
            <span>{bundle.topics.length}</span>
          </div>
          <div className="topicMap">
            {bundle.topics.map((topic) => (
              <button
                className={topic.id === selectedTopic?.id ? "topic active" : "topic"}
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                style={{ "--topic": topic.color, "--size": `${84 + topic.memoryCount * 18}px` } as React.CSSProperties}
                type="button"
              >
                <strong>{topic.name}</strong>
                <span>{topic.memoryCount} memories</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel detail">
          {selectedTopic ? (
            <>
              <div className="detailHead">
                <div>
                  <p className="eyebrow">Current cluster</p>
                  <h2>{selectedTopic.name}</h2>
                  <p>{selectedTopic.description}</p>
                </div>
                <span className="status">{formatDate(selectedTopic.latestActivity)}</span>
              </div>

              <form className="form" onSubmit={submitMemory}>
                <label>
                  Memory title
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name the idea, note, or reflection." />
                </label>
                <label>
                  Note
                  <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Capture the useful context while it is fresh." />
                </label>
                <label>
                  Growth
                  <input max="5" min="1" type="range" value={growth} onChange={(event) => setGrowth(Number(event.target.value))} />
                </label>
                <button disabled={isSaving || !title.trim() || !body.trim()} type="submit">Plant memory</button>
              </form>

              <div className="memoryList">
                {bundle.memories.map((memory) => (
                  <article className="memory" key={memory.id} style={{ borderColor: memory.topicColor }}>
                    <div>
                      <h3>{memory.title}</h3>
                      <p>{memory.body}</p>
                    </div>
                    <footer>
                      <span>{"●".repeat(memory.growth)}</span>
                      <time>Seen {formatDate(memory.lastSeenAt)}</time>
                    </footer>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>No topics yet.</p>
          )}
        </section>

        <aside className="sideStack">
          <section className="panel">
            <div className="panelHeader">
              <h2>Resurface</h2>
              <span>{bundle.resurfaced.length}</span>
            </div>
            <div className="resurfaceList">
              {bundle.resurfaced.map((memory) => (
                <button key={memory.id} onClick={() => markMemorySeen(memory.id)} type="button">
                  <strong>{memory.title}</strong>
                  <span>{memory.topicName} · {formatDate(memory.lastSeenAt)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Link ideas</h2>
            <form className="linkForm" onSubmit={submitLink}>
              <select value={sourceId} onChange={(event) => setSourceId(Number(event.target.value) || "")}>
                <option value="">Source memory</option>
                {bundle.allMemories.map((memory) => (
                  <option key={memory.id} value={memory.id}>{memory.title}</option>
                ))}
              </select>
              <select value={targetId} onChange={(event) => setTargetId(Number(event.target.value) || "")}>
                <option value="">Target memory</option>
                {bundle.allMemories.map((memory) => (
                  <option key={memory.id} value={memory.id}>{memory.title}</option>
                ))}
              </select>
              <textarea value={linkNote} onChange={(event) => setLinkNote(event.target.value)} placeholder="Why do these belong near each other?" />
              <button disabled={isSaving || !sourceId || !targetId || sourceId === targetId} type="submit">Link memories</button>
            </form>
            <div className="links">
              {bundle.links.map((link) => (
                <article key={link.id}>
                  <strong>{link.sourceTitle}</strong>
                  <span>{link.targetTitle}</span>
                  {link.note ? <p>{link.note}</p> : null}
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
