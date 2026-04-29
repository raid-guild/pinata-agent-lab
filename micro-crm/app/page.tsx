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

  async function loadBundle(contactId: number | null) {
    const suffix = contactId ? `?contactId=${contactId}` : "";
    const response = await fetch(`/app/api/contacts${suffix}`, { cache: "no-store" });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    if (!contactId && nextBundle.selected) {
      setSelectedId(nextBundle.selected.id);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Read-only relationship portfolio</p>
          <h1>Micro CRM</h1>
        </div>
        <div className="metrics" aria-label="Pipeline counts">
          {Object.entries(pipelineCounts).map(([status, count]) => (
            <span key={status}>
              <strong>{count}</strong> {status}
            </span>
          ))}
        </div>
      </header>

      <section className="grid">
        <aside className="panel contactList" aria-label="Contacts">
          <div className="panelHeader">
            <h2>Contacts</h2>
            <span className="countTag">{bundle.contacts.length}</span>
          </div>
          {bundle.contacts.map((contact) => (
            <button
              className={contact.id === selectedContact?.id ? "contact active" : "contact"}
              key={contact.id}
              onClick={() => setSelectedId(contact.id)}
              type="button"
            >
              <span>
                <strong>{contact.name}</strong>
                <small>{contact.company}</small>
              </span>
              <em className="tag">{contact.status}</em>
            </button>
          ))}
        </aside>

        <section className="panel detail">
          {selectedContact ? (
            <>
              <div className="detailHead">
                <div>
                  <p className="eyebrow">{selectedContact.role}</p>
                  <h2>{selectedContact.name}</h2>
                  <p>{selectedContact.company} · {selectedContact.email}</p>
                </div>
                <span className="status">{selectedContact.status}</span>
              </div>

              <div className="summaryGrid" aria-label="Selected contact status">
                <div className="summaryItem">
                  <span>Next action</span>
                  <strong>{selectedContact.nextAction || "No action set"}</strong>
                  <time>{selectedContact.nextActionDate || "Unscheduled"}</time>
                </div>
                <div className="summaryItem">
                  <span>Last contacted</span>
                  <strong>{selectedContact.lastContacted || "No date recorded"}</strong>
                  <time>{selectedContact.email}</time>
                </div>
              </div>

              <div className="timeline">
                <div className="panelHeader">
                  <h3>Timeline</h3>
                  <span className="countTag">{bundle.notes.length}</span>
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
              </div>
            </>
          ) : (
            <p>No contacts yet.</p>
          )}
        </section>

        <aside className="sideStack">
          <section className="panel">
            <div className="panelHeader">
              <h2>Due Follow-ups</h2>
              <span className="countTag">{bundle.followUps.length}</span>
            </div>
            <div className="followups">
              {bundle.followUps.length > 0 ? (
                bundle.followUps.map((contact) => (
                  <button key={contact.id} onClick={() => setSelectedId(contact.id)} type="button">
                    <strong>{contact.nextAction}</strong>
                    <span>{contact.name}</span>
                    <time>{contact.nextActionDate}</time>
                  </button>
                ))
              ) : (
                <p className="empty">No follow-ups are due.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h2>Stored Drafts</h2>
              <span className="countTag">{bundle.drafts.length}</span>
            </div>
            <div className="drafts">
              {bundle.drafts.length > 0 ? (
                bundle.drafts.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.subject}</strong>
                      <span className="tag">{item.status}</span>
                    </div>
                    <p>{item.body}</p>
                    <time>{formatDate(item.createdAt)}</time>
                  </article>
                ))
              ) : (
                <p className="empty">No follow-up drafts stored.</p>
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
