"use client";

import { useEffect, useMemo, useState } from "react";

type Dao = {
  id: number;
  name: string;
  daoAddress: string;
  chainId: string;
  communityMemoryUri: string;
  communityMemoryGatewayUrl: string;
  proposalWorkspaceUri: string;
  proposalWorkspaceGatewayUrl: string;
  sharedStateUri: string;
  sharedStateGatewayUrl: string;
  charter: string;
  thesis: string;
  conviction: string;
  platform: string;
  votingPower: string;
  status: string;
};

type Proposal = {
  id: number;
  daoId: number;
  daoName: string;
  daoAddress: string;
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
  contentGatewayUrl: string;
  updatedAt: string;
};

type GovernanceTask = {
  id: number;
  daoId: number | null;
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
  daoId: number;
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
  daoId: number;
  daoName: string;
  tableName: string;
  content: string;
  contentUri: string;
  contentGatewayUrl: string;
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
  const [selectedDaoId, setSelectedDaoId] = useState("all");
  const [syncingDaoId, setSyncingDaoId] = useState<number | null>(null);
  const [syncError, setSyncError] = useState("");
  const [lastOperation, setLastOperation] = useState<{
    title: string;
    tx: string;
    chain: "pending" | "ok" | "skipped" | "failed";
    daoSync: "pending" | "ok" | "failed";
    memorySync: "pending" | "ok" | "skipped" | "failed";
    dashboard: "pending" | "ok" | "failed";
    detail: string;
  } | null>(null);

  useEffect(() => {
    loadBundle(filter);
  }, [filter]);

  const selectedDao = useMemo(() => {
    const daoId = Number(selectedDaoId);
    return selectedDaoId === "all" ? null : bundle.daos.find((dao) => dao.id === daoId) || null;
  }, [bundle.daos, selectedDaoId]);

  const scoped = useMemo(() => {
    const daoId = Number(selectedDaoId);
    if (selectedDaoId === "all") return bundle;
    return {
      ...bundle,
      daos: bundle.daos.filter((dao) => dao.id === daoId),
      proposals: bundle.proposals.filter((proposal) => proposal.daoId === daoId),
      tasks: bundle.tasks.filter((task) => task.daoId === daoId),
      artifacts: bundle.artifacts.filter((artifact) => artifact.daoId === daoId),
      communityRecords: bundle.communityRecords.filter((record) => record.daoId === daoId)
    };
  }, [bundle, selectedDaoId]);

  const scopedStats = useMemo(() => ({
    daoCount: scoped.daos.length,
    activeDaos: scoped.daos.filter((dao) => dao.status === "active").length,
    openProposals: scoped.proposals.filter((proposal) => ["submitted", "voting", "grace", "ready"].includes(proposal.status)).length,
    readyToVote: scoped.proposals.filter((proposal) => proposal.status === "voting" && proposal.recommendedVote !== "defer").length,
    openTasks: scoped.tasks.filter((task) => task.status !== "done").length,
    urgentTasks: scoped.tasks.filter((task) => task.status !== "done" && task.priority === "urgent").length,
    freshArtifacts: scoped.artifacts.filter((artifact) => artifact.status === "fresh").length,
    pendingArtifactActions: scoped.artifacts.reduce((sum, artifact) => sum + artifact.pendingActionCount, 0),
    communityRecords: scoped.communityRecords.length
  }), [scoped]);

  const conviction = useMemo(() => {
    const scored = scoped.proposals.filter((proposal) => proposal.recommendedVote !== "defer").length;
    return scoped.proposals.length ? Math.round((scored / scoped.proposals.length) * 100) : 0;
  }, [scoped.proposals]);

  const memoryCoverage = useMemo(() => {
    const daoReady = scoped.daos.filter((dao) => dao.communityMemoryUri || dao.sharedStateUri || dao.proposalWorkspaceUri).length;
    const proposalReady = scoped.proposals.filter((proposal) => proposal.contentUri).length;
    return { daoReady, proposalReady };
  }, [scoped.daos, scoped.proposals]);

  const latestMemoryAt = scoped.communityRecords[0]?.createdAt || "";

  async function loadBundle(nextFilter: string) {
    const suffix = nextFilter === "all" ? "" : `?status=${nextFilter}`;
    const response = await fetch(`/app/api/governance${suffix}`, { cache: "no-store" });
    setBundle((await response.json()) as Bundle);
  }

  async function syncDao(daoId: number) {
    setSyncingDaoId(daoId);
    setSyncError("");
    setLastOperation({
      title: "Manual DAO sync",
      tx: "No transaction",
      chain: "skipped",
      daoSync: "pending",
      memorySync: "skipped",
      dashboard: "pending",
      detail: "Running /app/api/sync/dao"
    });
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
      setLastOperation({
        title: `Synced ${payload.result?.dao?.name || "DAO"}`,
        tx: "No transaction",
        chain: "skipped",
        daoSync: "ok",
        memorySync: "skipped",
        dashboard: "ok",
        detail: payload.result?.partial ? "Dashboard updated with partial service results." : "Dashboard updated with fresh service results."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sync DAO";
      setSyncError(message);
      setLastOperation({
        title: "Sync failed",
        tx: "No transaction",
        chain: "skipped",
        daoSync: "failed",
        memorySync: "skipped",
        dashboard: "failed",
        detail: message
      });
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
            <span>{scopedStats.openProposals} open</span>
          </div>

          <label className="daoSelect">
            <span>DAO scope</span>
            <select onChange={(event) => setSelectedDaoId(event.target.value)} value={selectedDaoId}>
              <option value="all">All DAOs</option>
              {bundle.daos.map((dao) => (
                <option key={dao.id} value={dao.id}>{dao.name}</option>
              ))}
            </select>
          </label>

          <div className="filterStack" aria-label="Proposal filters">
            {filters.map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <div className="statStack">
            <span><strong>{scopedStats.daoCount}</strong> DAOs held</span>
            <span><strong>{scopedStats.readyToVote}</strong> ready votes</span>
            <span><strong>{scopedStats.urgentTasks}</strong> urgent rites</span>
            <span><strong>{scopedStats.pendingArtifactActions}</strong> queued actions</span>
            <span><strong>{scopedStats.communityRecords}</strong> memory records</span>
            <span><strong>{memoryCoverage.daoReady}</strong> DAO workspaces</span>
            <span><strong>{memoryCoverage.proposalReady}</strong> proposal workspaces</span>
          </div>
        </aside>

        <section className="proposalBoard" aria-label="Read-only proposal dashboard">
          {scoped.proposals.map((proposal) => (
            <article className={`proposalCard stance-${proposal.agentStance}`} key={proposal.id}>
              <div className="cardTop">
                <span>{proposal.daoName}</span>
                <em>{proposal.status}</em>
              </div>
              <h2>#{proposal.proposalId} {proposal.title}</h2>
              <p>{proposal.summary}</p>
              <div className="readinessLine">
                {proposalBadges(proposal).map((badge) => (
                  <span className={`badge badge-${badge.kind}`} key={badge.label}>{badge.label}</span>
                ))}
              </div>
              {proposal.contentUri ? (
                <div className="memoryLinks proposalMemory">
                  <span>proposal workspace</span>
                  <MemoryLink gatewayUrl={proposal.contentGatewayUrl} uri={proposal.contentUri} />
                </div>
              ) : (
                <div className="memoryMissing">No proposal workspace linked yet.</div>
              )}
              <div className="voteLine">
                <strong>{proposal.recommendedVote}</strong>
                <span>{proposal.agentStance} / {proposal.confidence}</span>
              </div>
              <div className="quickActions" aria-label={`Quick links for proposal ${proposal.proposalId}`}>
                <a href={daohausProposalUrl(proposal)} rel="noreferrer" target="_blank">DAOhaus</a>
                {proposal.contentGatewayUrl || /^https?:\/\//.test(proposal.contentUri) ? (
                  <a href={proposal.contentGatewayUrl || proposal.contentUri} rel="noreferrer" target="_blank">Workspace</a>
                ) : null}
                <button onClick={() => navigator.clipboard?.writeText(proposal.proposalId)} type="button">Copy ID</button>
                <button disabled={syncingDaoId !== null} onClick={() => syncDao(proposal.daoId)} type="button">Sync DAO</button>
              </div>
              <footer>
                <small>{proposal.rationale}</small>
                <time>Due {proposal.dueDate || "unscheduled"} / Updated {formatDate(proposal.updatedAt)}</time>
              </footer>
            </article>
          ))}
          {scoped.proposals.length === 0 ? <p className="empty">No proposals match this filter.</p> : null}
        </section>
      </section>

      <section className="opsGrid">
        <section className="memoryHealth" aria-label="Memory health">
          <div className="sectionHead">
            <h2>Memory health</h2>
            <span>{selectedDao ? selectedDao.name : "all DAOs"}</span>
          </div>
          <div className="healthGrid">
            <HealthItem label="DAO metadata pointers" ready={memoryCoverage.daoReady} total={scoped.daos.length} />
            <HealthItem label="Proposal workspaces" ready={memoryCoverage.proposalReady} total={scoped.proposals.length} />
            <HealthItem label="Fresh sync checkpoints" ready={scopedStats.freshArtifacts} total={scoped.artifacts.length} />
            <HealthItem label="Latest memory record" note={latestMemoryAt ? formatDate(latestMemoryAt) : "none"} />
          </div>
        </section>

        <section className="operationPanel" aria-label="Last operation">
          <div className="sectionHead">
            <h2>Last operation</h2>
            <span>{lastOperation ? "tracked" : "idle"}</span>
          </div>
          {lastOperation ? (
            <div className="operationSteps">
              <strong>{lastOperation.title}</strong>
              <StatusLine label={lastOperation.tx} status={lastOperation.chain} />
              <StatusLine label="/app/api/sync/dao" status={lastOperation.daoSync} />
              <StatusLine label="/app/api/sync/memory" status={lastOperation.memorySync} />
              <StatusLine label="Dashboard updated" status={lastOperation.dashboard} />
              <p>{lastOperation.detail}</p>
            </div>
          ) : (
            <p className="empty">Sync or post-write confirmations will appear here.</p>
          )}
        </section>
      </section>

      <section className="lowerGrid">
        <section className="daoLedger" aria-label="DAO mandate ledger">
          <div className="sectionHead">
            <h2>Mandate ledger</h2>
            <span>{scopedStats.activeDaos} active</span>
          </div>
          {syncError ? <p className="syncError">{syncError}</p> : null}
          {scoped.daos.map((dao) => (
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
                  {dao.communityMemoryUri ? <MemoryLink gatewayUrl={dao.communityMemoryGatewayUrl} uri={dao.communityMemoryUri} /> : null}
                  {dao.sharedStateUri ? <span>shared state</span> : null}
                  {dao.sharedStateUri ? <MemoryLink gatewayUrl={dao.sharedStateGatewayUrl} uri={dao.sharedStateUri} /> : null}
                  {dao.proposalWorkspaceUri ? <span>proposal workspace root</span> : null}
                  {dao.proposalWorkspaceUri ? <MemoryLink gatewayUrl={dao.proposalWorkspaceGatewayUrl} uri={dao.proposalWorkspaceUri} /> : null}
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
            <span>{scopedStats.openTasks} open</span>
          </div>
          {scoped.tasks.map((task) => (
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
          <span>{scopedStats.freshArtifacts} fresh</span>
        </div>
        <div className="artifactBoard">
          {scoped.artifacts.map((checkpoint) => (
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
          {scoped.artifacts.length === 0 ? <p className="empty">No service sync checkpoints recorded yet.</p> : null}
        </div>
      </section>

      <section className="artifactGrid" aria-label="DAO database memory">
        <div className="sectionHead">
          <h2>DAO memory</h2>
          <span>{scoped.communityRecords.length} records</span>
        </div>
        <div className="artifactBoard">
          {scoped.communityRecords.slice(0, 6).map((record) => (
            <article className="artifact" key={record.id}>
              <div className="cardTop">
                <span>{record.daoName}</span>
                <em>{record.tableName}</em>
              </div>
              <strong>{record.recordType || record.threadId || record.proposalId || "memory"}</strong>
              <p>{summarizeRecord(record)}</p>
              {record.contentUri ? <MemoryLink gatewayUrl={record.contentGatewayUrl} uri={record.contentUri} /> : null}
              <time>Posted {formatDate(record.createdAt)}</time>
            </article>
          ))}
          {scoped.communityRecords.length === 0 ? <p className="empty">No DAO database memory synced yet.</p> : null}
        </div>
      </section>

      {selectedDao ? (
        <section className="daoDetail" aria-label={`${selectedDao.name} detail`}>
          <div className="sectionHead">
            <h2>DAO detail</h2>
            <span>{selectedDao.status}</span>
          </div>
          <div className="detailGrid">
            <div>
              <strong>{selectedDao.name}</strong>
              <p>{selectedDao.thesis || "No thesis recorded."}</p>
              <code>{selectedDao.daoAddress}</code>
            </div>
            <div>
              <span>Mandate</span>
              <p>{selectedDao.platform || selectedDao.conviction || "No voter platform recorded."}</p>
            </div>
            <div>
              <span>Activity</span>
              <p>{scoped.proposals.length} proposals / {scoped.tasks.length} tasks / {scoped.communityRecords.length} memory records</p>
            </div>
          </div>
        </section>
      ) : null}

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

function proposalBadges(proposal: Proposal) {
  const badges = [];
  if (proposal.contentUri) {
    badges.push({ label: "workspace", kind: "ok" });
  } else {
    badges.push({ label: "missing workspace", kind: "warn" });
  }
  if (proposal.status === "voting" && proposal.recommendedVote !== "defer") {
    badges.push({ label: "ready to vote", kind: "ok" });
  }
  if (proposal.status === "ready") {
    badges.push({ label: "ready to process", kind: "ok" });
  }
  if (proposal.status === "grace") {
    badges.push({ label: "grace", kind: "watch" });
  }
  if (proposal.status === "processed") {
    badges.push({ label: "processed", kind: "ok" });
  }
  if (proposal.recommendedVote === "defer") {
    badges.push({ label: "needs review", kind: "watch" });
  }
  return badges;
}

function daohausProposalUrl(proposal: Proposal) {
  return `https://admin.daohaus.club/molochv3/0x2105/${proposal.daoAddress}/proposal/${proposal.proposalId}`;
}

function MemoryLink({ gatewayUrl, uri }: { gatewayUrl: string; uri: string }) {
  const href = gatewayUrl || (/^https?:\/\//.test(uri) ? uri : "");
  if (!href) return <code>{uri}</code>;
  return (
    <a href={href} rel="noreferrer" target="_blank">
      <code>{uri}</code>
    </a>
  );
}

function HealthItem({ label, note, ready, total }: { label: string; note?: string; ready?: number; total?: number }) {
  const complete = total === undefined || total === 0 ? Boolean(note) : ready === total;
  return (
    <div className={`healthItem ${complete ? "complete" : "needsWork"}`}>
      <span>{label}</span>
      <strong>{note || `${ready || 0}/${total || 0}`}</strong>
    </div>
  );
}

function StatusLine({ label, status }: { label: string; status: "pending" | "ok" | "skipped" | "failed" }) {
  const mark = status === "ok" ? "done" : status === "failed" ? "failed" : status === "pending" ? "pending" : "skipped";
  return (
    <div className={`statusLine ${mark}`}>
      <span>{label}</span>
      <strong>{status}</strong>
    </div>
  );
}
