"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Read-only knowledge map</p>
          <h1>Memory Garden</h1>
        </div>
        <div className="metrics" aria-label="Garden totals">
          <span><strong>{bundle.topics.length}</strong> topics</span>
          <span><strong>{totalMemories}</strong> memories</span>
          <span><strong>{bundle.links.length}</strong> links</span>
        </div>
      </header>

      <section className="gardenGrid">
        <aside className="topics" aria-label="Topics">
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
                style={{ "--topic": topic.color, "--size": `${84 + topic.memoryCount * 18}px` } as CSSProperties}
                type="button"
              >
                <strong>{topic.name}</strong>
                <span>{topic.memoryCount} memories</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="detail">
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
                {bundle.memories.length === 0 ? <p className="empty">No memories in this cluster yet.</p> : null}
              </div>
            </>
          ) : (
            <p>No topics yet.</p>
          )}
        </section>

        <aside className="sideStack">
          <section className="panel resurfacePanel">
            <div className="panelHeader">
              <h2>Resurface</h2>
              <span>{bundle.resurfaced.length}</span>
            </div>
            <div className="resurfaceList">
              {bundle.resurfaced.map((memory) => (
                <article key={memory.id}>
                  <strong>{memory.title}</strong>
                  <span>{memory.topicName} · {formatDate(memory.lastSeenAt)}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h2>Idea links</h2>
              <span>{bundle.links.length}</span>
            </div>
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
