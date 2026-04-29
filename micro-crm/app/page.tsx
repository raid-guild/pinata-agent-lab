"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState(today());
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBundle(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (bundle.selected) {
      setNextAction(bundle.selected.nextAction);
      setNextActionDate(bundle.selected.nextActionDate || today());
      setDraft(`Hi ${bundle.selected.name.split(" ")[0]},\n\nFollowing up on ${bundle.selected.nextAction.toLowerCase() || "our last conversation"}. Would it be useful to compare next steps this week?`);
    }
  }, [bundle.selected]);

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

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedContact) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: selectedContact.id,
        body: note,
        nextAction,
        nextActionDate
      })
    });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    setNote("");
    setIsSaving(false);
  }

  async function saveDraft() {
    if (!selectedContact) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/app/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: selectedContact.id, body: draft })
    });
    const nextBundle = (await response.json()) as Bundle;
    setBundle(nextBundle);
    setIsSaving(false);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Solo operator workspace</p>
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
            <span>{bundle.contacts.length}</span>
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
              <em>{contact.status}</em>
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

              <div className="nextAction">
                <span>Next action</span>
                <strong>{selectedContact.nextAction || "No action set"}</strong>
                <time>{selectedContact.nextActionDate || "Unscheduled"}</time>
              </div>

              <form className="form" onSubmit={submitNote}>
                <label>
                  Note
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture the latest conversation, decision, or signal." />
                </label>
                <div className="formRow">
                  <label>
                    Next action
                    <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
                  </label>
                  <label>
                    Date
                    <input type="date" value={nextActionDate} onChange={(event) => setNextActionDate(event.target.value)} />
                  </label>
                </div>
                <button disabled={isSaving || !note.trim()} type="submit">Save note</button>
              </form>

              <div className="timeline">
                <h3>Notes</h3>
                {bundle.notes.map((item) => (
                  <article key={item.id}>
                    <time>{formatDate(item.createdAt)}</time>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>No contacts yet.</p>
          )}
        </section>

        <aside className="sideStack">
          <section className="panel">
            <div className="panelHeader">
              <h2>Today</h2>
              <span>{bundle.followUps.length}</span>
            </div>
            <div className="followups">
              {bundle.followUps.map((contact) => (
                <button key={contact.id} onClick={() => setSelectedId(contact.id)} type="button">
                  <strong>{contact.nextAction}</strong>
                  <span>{contact.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Draft follow-up</h2>
            <textarea className="draftBox" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <button disabled={isSaving || !draft.trim()} onClick={saveDraft} type="button">Store draft</button>
            <div className="drafts">
              {bundle.drafts.map((item) => (
                <article key={item.id}>
                  <strong>{item.subject}</strong>
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
