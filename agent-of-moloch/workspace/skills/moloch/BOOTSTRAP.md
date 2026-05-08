# Agent Bootstrap

Use this document when an agent is setting itself up for a DAO for the first time. This is not an experiment script and does not define the agent's mandate. The bootstrap step gathers the operator's intent, creates the first operating files, verifies dependencies, and starts the correct tasks.

## Terms

- **Conviction**: the agent's values, bias, and long-term orientation.
- **Mandate**: the concrete operating artifact the agent loads during tasks. It includes identity, voting policy, autonomy rules, initiative backlog, and execution policy.
- **Shared memory**: DAO-level public context using DAO database records plus IPFS-pinned artifacts.
- **Workspace**: an IPFS-pinned snapshot for the DAO or a proposal. Workspaces are linked from DAO metadata or proposal `contentURI`.

The `moloch-agent-conviction` skill manages the mandate file, but the agent should not invent the mandate during generic bootstrap. Ask the operator for the mandate or load it from the harness.

## Bootstrap Goal

The first run should answer these questions:

1. Which DAO is this agent operating in, or should it summon a new DAO?
2. Which wallet/account is the agent using?
3. What is the operator-provided mandate?
4. Where is shared DAO memory?
5. Can the agent read chain state, Graph data, and DAO database records?
6. Can the agent pin IPFS artifacts when needed?
7. Which scheduled tasks should run?

## Operator Inputs

Ask the operator or harness for these values. Do not guess them.

- Agent name.
- Agent wallet address.
- DAO address, or explicit instruction to summon a new DAO.
- If summoning: DAO name, token symbols, initial members, governance settings, and initial metadata.
- Mandate or mandate source path.
- Whether the mandate should be public, private, or ratified by DAO proposal.
- Shared memory root, if one already exists.
- Pinning provider preference, if IPFS publishing is expected.
- Scheduled task cadence.

If a required value is missing, create a local draft and record the missing field. Do not treat a draft mandate as ratified DAO truth.

## Dependency Check

Verify the runtime before autonomous work starts:

```bash
node moloch-shared/scripts/moloch.mjs capabilities
node moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --first 100 --out-dir /data/custom/moloch-skills/artifacts/0xDAO
```

Required for autonomous write actions:

- `RPC_URL`
- managed signer or `PRIVATE_KEY`
- funded wallet

Required for indexed discovery:

- `GRAPH_URL` or `GRAPH_API_KEY`

Required for publishing larger/versioned artifacts:

- Pinata or another pinning provider credential, if configured by the harness.

## Mandate Setup

Use the template only after the operator provides the mandate content or source:

```text
moloch-agent-conviction/assets/conviction-profile.template.json
```

Fill the mandate with:

- identity
- DAO address
- wallet address
- conviction values
- voting policy
- sponsorship policy
- initiative backlog
- autonomous execution policy
- audit/posting behavior

Recommended storage:

```text
/data/custom/moloch-skills/profiles/<dao>-<agent>-mandate.json
```

The mandate should stay small. It should not contain private keys, raw proposal data, large histories, or transient local cache.

If the mandate should be public, pin it or post a pointer through DAO database memory. If the DAO should ratify it, submit a signal proposal that links the mandate URI.

## DAO Setup

If the DAO already exists:

1. Read `daoProfile`.
2. Read `communityMemory`, `signal`, and relevant DAO database records.
3. Find `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI`.
4. Fetch the current `community-state.md` if available.
5. Run `task-snapshot`.

If the agent is explicitly asked to summon:

1. Create or locate the shared memory starter directory.
2. Create the first `community-state.md` from operator-provided DAO intent.
3. Pin the shared memory root if a pinning provider is available.
4. Include shared memory pointers in summon metadata when available.
5. Summon the DAO.
6. Run `task-snapshot`.
7. Post a `communityMemory` thread-root announcing the bootstrap state when the agent is a DAO member.

If CIDs are not ready before summon, summon without them and immediately prepare a `dao-meta` proposal to publish the pointers.

## Shared Memory Rule

Local files are scratch. Shared knowledge should be published.

- Short public coordination: DAO database records with `memory-post`.
- Larger/versioned artifacts: IPFS, then link the CID from DAO database records or proposal `contentURI`.
- Governance execution truth: direct chain reads.
- Indexed discovery: The Graph.

Use the `community-memory/v1` envelope for DAO database records. Prefer `threadId` as the grouping key.

## First Scheduled Tasks

After bootstrap, configure these tasks as appropriate:

1. **Proposal Action Watcher**
   - sponsor, vote, process, cancel, and post-action records
   - direct chain preflight before writes
   - process ready proposals as mechanical settlement

2. **Initiative Steward**
   - maintain the mandate initiative backlog
   - update operating context after passed, failed, rejected, or processed proposals
   - prepare draft workspaces when an initiative becomes ready

3. **Proposal Generation**
   - create at most one proposal when the mandate and proposal throttle allow it
   - link proposal workspaces through `contentURI`
   - post proposal notes to DAO database memory

## Bootstrap Output

At the end of bootstrap, produce a compact operator-facing summary:

- DAO address or summon tx hash.
- Agent wallet address.
- Mandate path or mandate URI.
- Shared memory pointers found or created.
- Dependency status: RPC, Graph, signer, pinning.
- Scheduled tasks configured.
- Missing fields or blocked capabilities.

