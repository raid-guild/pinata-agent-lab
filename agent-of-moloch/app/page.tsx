"use client";

import { useEffect, useMemo, useState } from "react";

type Dao = {
  id: number;
  name: string;
  daoAddress: string;
  chainId: string;
  communityMemoryUri: string;
  proposalWorkspaceUri: string;
  sharedStateUri: string;
  charter: string;
  thesis: string;
  conviction: string;
  platform: string;
  votingPower: string;
  status: string;
};

type Proposal = {
  id: number;
  daoName: string;
  proposalId: string;
  title: string;
  summary: string;
  proposalType: string;
  status: string;
  agentStance: string;
  confidence: string;
  recommendedVote: string;
  rationale: string;
  dueDate: string;
  contentUri: string;
  contentUriType: string;
  updatedAt: string;
};

type GovernanceTask = {
  id: number;
  daoName: string | null;
  proposalTitle: string | null;
  title: string;
  body: string;
  actionType: string;
  status: string;
  priority: string;
  dueDate: string;
};

type SyncCheckpoint = {
  id: number;
  daoName: string;
  artifactDir: string;
  checkpointPath: string;
  operatingContextPath: string;
  proposalSummaryPath: string;
  processQueuePath: string;
  updatedAt: string;
  lastGraphProposalIdSeen: number;
  votingCount: number;
  needsProcessingCount: number;
  pendingActionCount: number;
  status: string;
};

type CommunityRecord = {
  id: number;
  daoName: string;
  tableName: string;
  content: string;
  contentUri: string;
  threadId: string;
  proposalId: string;
  recordType: string;
  createdAt: string;
};

type Bundle = {
  daos: Dao[];
  proposals: Proposal[];
  tasks: GovernanceTask[];
  artifacts: SyncCheckpoint[];
  communityRecords: CommunityRecord[];
  stats: {
    daoCount: number;
    activeDaos: number;
    openProposals: number;
    readyToVote: number;
    openTasks: number;
    urgentTasks: number;
    freshArtifacts: number;
    pendingArtifactActions: number;
    communityRecords: number;
  };
};

const emptyBundle: Bundle = {
  daos: [],
  proposals: [],
  tasks: [],
  artifacts: [],
  communityRecords: [],
  stats: {
    daoCount: 0,
    activeDaos: 0,
    openProposals: 0,
    readyToVote: 0,
    openTasks: 0,
    urgentTasks: 0,
    freshArtifacts: 0,
    pendingArtifactActions: 0,
    communityRecords: 0
  }
};

const filters = ["all", "submitted", "voting", "ready", "processed"];

export default function Home() {
  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [filter, setFilter] = useState("all");
  const [syncingDaoId, setSyncingDaoId] = useState<number | null>(null);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    loadBundle(filter);
  }, [filter]);

  const conviction = useMemo(() => {
    const scored = bundle.proposals.filter((proposal) => proposal.recommendedVote !== "defer").length;
    return bundle.proposals.length ? Math.round((scored / bundle.proposals.length) * 100) : 0;
  }, [bundle.proposals]);

  const memoryCoverage = useMemo(() => {
    const daoReady = bundle.daos.filter((dao) => dao.communityMemoryUri || dao.sharedStateUri || dao.proposalWorkspaceUri).length;
    const proposalReady = bundle.proposals.filter((proposal) => proposal.contentUri).length;
    return { daoReady, proposalReady };
  }, [bundle.daos, bundle.proposals]);

  async function loadBundle(nextFilter: string) {
    const suffix = nextFilter === "all" ? "" : `?status=${nextFilter}`;
    const response = await fetch(`/app/api/governance${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  async function syncDao(daoId: number) {
    setSyncingDaoId(daoId);
    setSyncError("");
    try {
      const response = await fetch("/app/api/sync/dao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ daoId })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to sync DAO");
      }
      await loadBundle(filter);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unable to sync DAO");
    } finally {
      setSyncingDaoId(null);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Moloch watches the queue</p>
          <h1>Agent of Moloch</h1>
          <p>
            A characterful governance agent for Baal DAOs: it remembers each DAO's charter, states its voter
            platform, syncs service-backed DAO state, and queues cautious tasks before any onchain move.
          </p>
        </div>

        <div className="maskPanel" aria-label="Agent character">
          <div className="mask" aria-hidden="true">
            <span />
            <span />
          </div>
          <strong>{conviction}%</strong>
          <em>mandate scored</em>
          <p>Sync first. Preflight live. Send only when mandate and harness policy permit it.</p>
        </div>
      </section>

      <section className="featureGrid" aria-label="Agent vows">
        <article>
          <span>Charter</span>
          <strong>DAO memory</strong>
          <p>Stores the thesis, charter, address, route, voting power, and operating context for each DAO.</p>
        </article>
        <article>
          <span>Conviction</span>
          <strong>Governance mandate</strong>
          <p>Turns values, hard-no rules, abstain rules, and escalation policy into a durable voting policy.</p>
        </article>
        <article>
          <span>Augury</span>
          <strong>Proposal record</strong>
          <p>Tracks lifecycle state, vote memos, rationale, due dates, and the next review needed before voting.</p>
        </article>
        <article>
          <span>Sync</span>
          <strong>Service watch</strong>
          <p>Surfaces service-backed sync state: DAO profile, proposal list, DAO database memory, and process queue.</p>
        </article>
      </section>

      <section className="workspace">
        <aside className="controlPanel">
          <div className="sectionHead">
            <h2>Proposal lens</h2>
            <span>{bundle.stats.openProposals} open</span>
          </div>

          <div className="filterStack" aria-label="Proposal filters">
            {filters.map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <div className="statStack">
            <span><strong>{bundle.stats.daoCount}</strong> DAOs held</span>
            <span><strong>{bundle.stats.readyToVote}</strong> ready votes</span>
            <span><strong>{bundle.stats.urgentTasks}</strong> urgent rites</span>
            <span><strong>{bundle.stats.pendingArtifactActions}</strong> queued actions</span>
            <span><strong>{bundle.stats.communityRecords}</strong> memory records</span>
            <span><strong>{memoryCoverage.daoReady}</strong> DAO workspaces</span>
            <span><strong>{memoryCoverage.proposalReady}</strong> proposal workspaces</span>
          </div>
        </aside>

        <section className="proposalBoard" aria-label="Read-only proposal dashboard">
          {bundle.proposals.map((proposal) => (
            <article className={`proposalCard stance-${proposal.agentStance}`} key={proposal.id}>
              <div className="cardTop">
                <span>{proposal.daoName}</span>
                <em>{proposal.status}</em>
              </div>
              <h2>#{proposal.proposalId} {proposal.title}</h2>
              <p>{proposal.summary}</p>
              {proposal.contentUri ? (
                <div className="memoryLinks proposalMemory">
                  <span>proposal workspace</span>
                  <code>{proposal.contentUri}</code>
                </div>
              ) : (
                <div className="memoryMissing">No proposal workspace linked yet.</div>
              )}
              <div className="voteLine">
                <strong>{proposal.recommendedVote}</strong>
                <span>{proposal.agentStance} / {proposal.confidence}</span>
              </div>
              <footer>
                <small>{proposal.rationale}</small>
                <time>Due {proposal.dueDate || "unscheduled"} / Updated {formatDate(proposal.updatedAt)}</time>
              </footer>
            </article>
          ))}
          {bundle.proposals.length === 0 ? <p className="empty">No proposals match this filter.</p> : null}
        </section>
      </section>

      <section className="lowerGrid">
        <section className="daoLedger" aria-label="DAO mandate ledger">
          <div className="sectionHead">
            <h2>Mandate ledger</h2>
            <span>{bundle.stats.activeDaos} active</span>
          </div>
          {syncError ? <p className="syncError">{syncError}</p> : null}
          {bundle.daos.map((dao) => (
            <article key={dao.id}>
              <div className="daoTitleRow">
                <div>
                  <strong>{dao.name}</strong>
                  <span>{dao.status} / chain {dao.chainId}</span>
                </div>
                <button disabled={syncingDaoId !== null} onClick={() => syncDao(dao.id)} type="button">
                  {syncingDaoId === dao.id ? "Syncing" : "Sync"}
                </button>
              </div>
              <p>{dao.thesis}</p>
              <blockquote>{dao.platform}</blockquote>
              {dao.communityMemoryUri || dao.sharedStateUri || dao.proposalWorkspaceUri ? (
                <div className="memoryLinks">
                  {dao.communityMemoryUri ? <span>community memory</span> : null}
                  {dao.communityMemoryUri ? <code>{dao.communityMemoryUri}</code> : null}
                  {dao.sharedStateUri ? <span>shared state</span> : null}
                  {dao.sharedStateUri ? <code>{dao.sharedStateUri}</code> : null}
                  {dao.proposalWorkspaceUri ? <span>proposal workspace root</span> : null}
                  {dao.proposalWorkspaceUri ? <code>{dao.proposalWorkspaceUri}</code> : null}
                </div>
              ) : (
                <div className="memoryMissing">No DAO memory pointers synced yet.</div>
              )}
            </article>
          ))}
        </section>

        <section className="taskQueue" aria-label="Suggested governance tasks">
          <div className="sectionHead">
            <h2>Next rites</h2>
            <span>{bundle.stats.openTasks} open</span>
          </div>
          {bundle.tasks.map((task) => (
            <article className={`task priority-${task.priority}`} key={task.id}>
              <span>{task.actionType}</span>
              <strong>{task.title}</strong>
              <p>{task.body}</p>
              <small>{task.daoName || "No DAO"} / {task.status} / due {task.dueDate || "unscheduled"}</small>
            </article>
          ))}
        </section>
      </section>

      <section className="artifactGrid" aria-label="Service sync checkpoints">
        <div className="sectionHead">
          <h2>Service sync</h2>
          <span>{bundle.stats.freshArtifacts} fresh</span>
        </div>
        <div className="artifactBoard">
          {bundle.artifacts.map((checkpoint) => (
            <article className={`artifact status-${checkpoint.status}`} key={checkpoint.id}>
              <div className="cardTop">
                <span>{checkpoint.daoName}</span>
                <em>{checkpoint.status}</em>
              </div>
              <strong>{checkpoint.artifactDir}</strong>
              <div className="artifactStats">
                <span><b>{checkpoint.votingCount}</b> voting</span>
                <span><b>{checkpoint.needsProcessingCount}</b> process</span>
                <span><b>{checkpoint.lastGraphProposalIdSeen}</b> last seen</span>
              </div>
              <p>{checkpoint.pendingActionCount} pending actions from service sync and process queue.</p>
              <code>{checkpoint.checkpointPath}</code>
              <code>{checkpoint.operatingContextPath}</code>
              <code>{checkpoint.proposalSummaryPath}</code>
              <time>Updated {formatDate(checkpoint.updatedAt)}</time>
            </article>
          ))}
          {bundle.artifacts.length === 0 ? <p className="empty">No service sync checkpoints recorded yet.</p> : null}
        </div>
      </section>

      <section className="artifactGrid" aria-label="DAO database memory">
        <div className="sectionHead">
          <h2>DAO memory</h2>
          <span>{bundle.communityRecords.length} records</span>
        </div>
        <div className="artifactBoard">
          {bundle.communityRecords.slice(0, 6).map((record) => (
            <article className="artifact" key={record.id}>
              <div className="cardTop">
                <span>{record.daoName}</span>
                <em>{record.tableName}</em>
              </div>
              <strong>{record.recordType || record.threadId || record.proposalId || "memory"}</strong>
              <p>{summarizeRecord(record)}</p>
              {record.contentUri ? <code>{record.contentUri}</code> : null}
              <time>Posted {formatDate(record.createdAt)}</time>
            </article>
          ))}
          {bundle.communityRecords.length === 0 ? <p className="empty">No DAO database memory synced yet.</p> : null}
        </div>
      </section>

      <section className="apiStrip" aria-label="Useful API routes">
        <code>GET /app/api/governance</code>
        <code>POST /app/api/artifacts</code>
        <code>POST /app/api/sync/dao</code>
        <code>POST /app/api/sync/memory</code>
        <code>GET /app/api/community-memory</code>
        <code>POST /app/api/daos</code>
        <code>POST /app/api/proposals</code>
        <code>POST /app/api/tasks</code>
        <code>POST /app/api/openclaw/responses</code>
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

function summarizeRecord(record: CommunityRecord) {
  try {
    const parsed = JSON.parse(record.content);
    return parsed.title || parsed.body || parsed.description || record.content.slice(0, 180);
  } catch {
    return record.content.slice(0, 180) || "Synced DAO database record.";
  }
}
