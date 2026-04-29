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

const islandPositions = [
  { x: 18, y: 30 },
  { x: 46, y: 18 },
  { x: 72, y: 36 },
  { x: 30, y: 66 },
  { x: 62, y: 72 },
  { x: 84, y: 62 }
];

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
  const selectedColor = selectedTopic?.color ?? "#2f7d66";

  async function loadBundle(topicId: number | null) {
    const suffix = topicId ? `?topicId=${topicId}` : "";
    const response = await fetch(`/app/api/memories${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  return (
    <main className="shell" style={{ "--active-topic": selectedColor } as CSSProperties}>
      <section className="gardenHero">
        <div>
          <p className="eyebrow">Living knowledge map</p>
          <h1>Memory Garden</h1>
          <p>Read-only clusters, resurfaced ideas, and memory links maintained through chat.</p>
        </div>
        <div className="gardenStats">
          <span><strong>{bundle.topics.length}</strong> topics</span>
          <span><strong>{totalMemories}</strong> memories</span>
          <span><strong>{bundle.links.length}</strong> links</span>
        </div>
      </section>

      <section className="gardenMap" aria-label="Topic garden map">
        <svg className="linkCanopy" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 30 C32 8 52 8 72 36" />
          <path d="M30 66 C42 48 54 48 62 72" />
          <path d="M46 18 C54 36 62 48 84 62" />
        </svg>

        {bundle.topics.map((topic, index) => {
          const position = islandPositions[index % islandPositions.length];
          return (
            <button
              className={topic.id === selectedTopic?.id ? "topicIsland active" : "topicIsland"}
              key={topic.id}
              onClick={() => setSelectedTopicId(topic.id)}
              style={{
                "--topic": topic.color,
                "--size": `${118 + topic.memoryCount * 18}px`,
                left: `${position.x}%`,
                top: `${position.y}%`
              } as CSSProperties}
              type="button"
            >
              <span className="growthRing" />
              <strong>{topic.name}</strong>
              <em>{topic.memoryCount} memories</em>
            </button>
          );
        })}

        <aside className="sproutShelf" aria-label="Resurfaced memories">
          <div className="sectionHead">
            <h2>Resurfacing</h2>
            <span>{bundle.resurfaced.length}</span>
          </div>
          {bundle.resurfaced.map((memory) => (
            <article key={memory.id}>
              <i style={{ background: memory.topicColor }} />
              <strong>{memory.title}</strong>
              <span>{memory.topicName} / seen {formatDate(memory.lastSeenAt)}</span>
            </article>
          ))}
        </aside>
      </section>

      <section className="clusterTray">
        {selectedTopic ? (
          <>
            <div className="clusterIntro">
              <p className="eyebrow">Current cluster</p>
              <h2>{selectedTopic.name}</h2>
              <p>{selectedTopic.description}</p>
              <time>Latest growth {formatDate(selectedTopic.latestActivity)}</time>
            </div>

            <div className="memoryBloom">
              {bundle.memories.map((memory) => (
                <article className="memoryPetal" key={memory.id} style={{ "--petal": memory.topicColor } as CSSProperties}>
                  <span>{"✦".repeat(memory.growth)}</span>
                  <h3>{memory.title}</h3>
                  <p>{memory.body}</p>
                  <time>Seen {formatDate(memory.lastSeenAt)}</time>
                </article>
              ))}
              {bundle.memories.length === 0 ? <p className="empty">No memories in this cluster yet.</p> : null}
            </div>
          </>
        ) : (
          <p className="empty">No topics yet.</p>
        )}
      </section>

      <section className="linkLedger" aria-label="Idea links">
        <div className="sectionHead">
          <h2>Visible paths</h2>
          <span>{bundle.links.length}</span>
        </div>
        <div className="linkCards">
          {bundle.links.map((link) => (
            <article key={link.id}>
              <strong>{link.sourceTitle}</strong>
              <span>{link.targetTitle}</span>
              {link.note ? <p>{link.note}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <footer className="cohortFooter">built by the RaidGuild cohort</footer>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
