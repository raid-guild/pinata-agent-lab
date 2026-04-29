"use client";

import { useEffect, useMemo, useState } from "react";

type Contact = {
  id: number;
  name: string;
  company: string;
  role: string;
  email: string;
  status: string;
  nextAction: string;
  nextActionDate: string;
  lastContacted: string;
};

type Note = {
  id: number;
  body: string;
  createdAt: string;
};

type Draft = {
  id: number;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

type Bundle = {
  contacts: Contact[];
  selected: Contact | null;
  notes: Note[];
  drafts: Draft[];
  followUps: Contact[];
};

const emptyBundle: Bundle = {
  contacts: [],
  selected: null,
  notes: [],
  drafts: [],
  followUps: []
};

const statusOrder = ["active", "proposal", "lead"];

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  const selectedContact = bundle.selected;
  const pipelineCounts = useMemo(() => {
    return bundle.contacts.reduce<Record<string, number>>((counts, contact) => {
      counts[contact.status] = (counts[contact.status] ?? 0) + 1;
      return counts;
    }, {});
  }, [bundle.contacts]);

  const orderedStatuses = useMemo(() => {
    const seen = new Set(Object.keys(pipelineCounts));
    const ordered = statusOrder.filter((status) => seen.has(status));
    for (const status of seen) {
      if (!ordered.includes(status)) ordered.push(status);
    }
    return ordered;
  }, [pipelineCounts]);

  async function loadBundle(contactId: number | null) {
    const suffix = contactId ? `?contactId=${contactId}` : "";
    const response = await fetch(`/app/api/contacts${suffix}`, { cache: "no-store" });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    if (!contactId && nextBundle.selected) {
      setSelectedId(nextBundle.selected.id);
    }
  }

  const selectedDue = selectedContact ? getDaysUntil(selectedContact.nextActionDate) : null;

  return (
    <main className="shell">
      <section className="radarHero">
        <div className="heroCopy">
          <p className="eyebrow">Relationship radar</p>
          <h1>Micro CRM</h1>
          <p>
            A read-only command center for warm relationships, next actions, and draft follow-ups kept current
            through chat.
          </p>
        </div>

        <div className="heroPanel" aria-label="Pipeline overview">
          <div className="panelLabel">
            <span>Pipeline signal</span>
            <strong>{bundle.contacts.length} contacts</strong>
          </div>
          <div className="pipelineRail">
            {orderedStatuses.map((status) => {
              const count = pipelineCounts[status] ?? 0;
              const width = bundle.contacts.length ? Math.max(12, (count / bundle.contacts.length) * 100) : 0;
              return (
                <span
                  className={`pipelineSegment ${statusClass(status)}`}
                  key={status}
                  style={{ width: `${width}%` }}
                  title={`${count} ${status}`}
                />
              );
            })}
          </div>
          <div className="pipelineLegend">
            {orderedStatuses.map((status) => (
              <span key={status}>
                <i className={statusClass(status)} /> {pipelineCounts[status]} {status}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="signalStrip" aria-label="Due follow-ups">
        <div>
          <p className="eyebrow">Due now</p>
          <strong>{bundle.followUps.length} follow-ups need attention</strong>
        </div>
        <div className="followupRail">
          {bundle.followUps.length > 0 ? (
            bundle.followUps.map((contact) => (
              <button
                className={contact.id === selectedContact?.id ? "followupChip active" : "followupChip"}
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                type="button"
              >
                <span>{contact.name}</span>
                <strong>{contact.nextAction}</strong>
                <time>{formatDate(contact.nextActionDate)}</time>
              </button>
            ))
          ) : (
            <span className="quiet">No urgent follow-ups.</span>
          )}
        </div>
      </section>

      <section className="radarGrid">
        <section className="accountMatrix" aria-label="Relationship accounts">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Accounts</p>
              <h2>Relationship matrix</h2>
            </div>
            <span>{bundle.contacts.length} tracked</span>
          </div>

          <div className="accountTiles">
            {bundle.contacts.map((contact) => {
              const daysUntil = getDaysUntil(contact.nextActionDate);
              return (
                <button
                  className={contact.id === selectedContact?.id ? "accountTile active" : "accountTile"}
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  type="button"
                >
                  <span className={`statusDot ${statusClass(contact.status)}`} />
                  <span className="accountTop">
                    <strong>{contact.name}</strong>
                    <em>{contact.status}</em>
                  </span>
                  <span className="company">{contact.company}</span>
                  <span className="actionLine">{contact.nextAction || "No next action"}</span>
                  <span className={daysUntil <= 0 ? "dueBadge urgent" : "dueBadge"}>
                    {formatUrgency(daysUntil)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dossier" aria-label="Selected contact dossier">
          {selectedContact ? (
            <>
              <div className="dossierHeader">
                <div>
                  <p className="eyebrow">{selectedContact.role}</p>
                  <h2>{selectedContact.name}</h2>
                  <p>{selectedContact.company}</p>
                </div>
                <span className={`dossierStatus ${statusClass(selectedContact.status)}`}>{selectedContact.status}</span>
              </div>

              <div className="contactVitals">
                <article>
                  <span>Next move</span>
                  <strong>{selectedContact.nextAction || "No action set"}</strong>
                  <time>{selectedContact.nextActionDate || "Unscheduled"}</time>
                </article>
                <article>
                  <span>Cadence risk</span>
                  <strong>{selectedDue === null ? "Unknown" : formatUrgency(selectedDue)}</strong>
                  <time>Last touch {selectedContact.lastContacted || "not recorded"}</time>
                </article>
                <article>
                  <span>Contact</span>
                  <strong>{selectedContact.email}</strong>
                  <time>{selectedContact.role}</time>
                </article>
              </div>

              <div className="dossierBody">
                <section className="timeline">
                  <div className="sectionHead compact">
                    <h3>Timeline ticks</h3>
                    <span>{bundle.notes.length}</span>
                  </div>
                  {bundle.notes.length > 0 ? (
                    bundle.notes.map((item) => (
                      <article key={item.id}>
                        <time>{formatDate(item.createdAt)}</time>
                        <p>{item.body}</p>
                      </article>
                    ))
                  ) : (
                    <p className="empty">No notes stored for this contact.</p>
                  )}
                </section>

                <section className="draftStack">
                  <div className="sectionHead compact">
                    <h3>Draft queue</h3>
                    <span>{bundle.drafts.length}</span>
                  </div>
                  {bundle.drafts.length > 0 ? (
                    bundle.drafts.map((item) => (
                      <article key={item.id}>
                        <span>{item.status}</span>
                        <strong>{item.subject}</strong>
                        <p>{item.body}</p>
                        <time>{formatDate(item.createdAt)}</time>
                      </article>
                    ))
                  ) : (
                    <p className="empty">No follow-up drafts stored.</p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <p className="empty">No contacts yet.</p>
          )}
        </section>
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

function statusClass(status: string) {
  return `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getDaysUntil(value: string) {
  if (!value) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function formatUrgency(daysUntil: number) {
  if (daysUntil <= 0) return "due now";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil >= 999) return "unscheduled";
  return `${daysUntil} days`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
