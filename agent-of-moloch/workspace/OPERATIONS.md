# Operations

The browser dashboard at `/app` is read-only. Agents write through local API routes after the user asks for a change.

## Health

```http
GET /app/api/health
```

Returns:

```json
{ "ok": true, "service": "agent-of-moloch" }
```

## Governance Bundle

```http
GET /app/api/governance
GET /app/api/governance?status=voting
```

Returns DAOs, proposal records, suggested tasks, snapshot artifacts, and summary stats for the dashboard.

## DAOs

```http
GET /app/api/daos
POST /app/api/daos
PATCH /app/api/daos/:id
DELETE /app/api/daos/:id
```

Example payload:

```json
{
  "name": "Meta Clawtel",
  "daoAddress": "0x...",
  "chainId": "8453",
  "daohausUrl": "https://admin.daohaus.club/#/molochv3/0x2105/0x...",
  "charter": "Prototype agent-friendly DAO operations.",
  "thesis": "Use explicit voter platforms to make agent governance legible.",
  "conviction": "Prefer reversible experiments and documented permissions.",
  "platform": "Vote yes on scoped experiments with owners and review dates.",
  "votingPower": "unknown",
  "status": "active"
}
```

## Proposals

```http
GET /app/api/proposals
GET /app/api/proposals?status=voting
POST /app/api/proposals
PATCH /app/api/proposals/:id
DELETE /app/api/proposals/:id
```

Proposal statuses: `draft`, `submitted`, `voting`, `grace`, `ready`, `processed`, `cancelled`.

Recommended votes: `yes`, `no`, `abstain`, `defer`.

## Tasks

```http
GET /app/api/tasks
GET /app/api/tasks?status=open
POST /app/api/tasks
PATCH /app/api/tasks/:id
DELETE /app/api/tasks/:id
```

Task action types: `read-dao`, `check-proposal`, `vote`, `sponsor`, `process`, `record`.

## Snapshot Artifacts

```http
GET /app/api/artifacts
POST /app/api/artifacts
```

Use this route to record the latest `task-snapshot` output paths and checkpoint summary for a DAO.

Example payload:

```json
{
  "daoId": 1,
  "artifactDir": "workspace/runtime/moloch-artifacts/0xDAO",
  "checkpointPath": "workspace/runtime/moloch-artifacts/0xDAO/checkpoint.json",
  "operatingContextPath": "workspace/runtime/moloch-artifacts/0xDAO/operating-context.json",
  "proposalSummaryPath": "workspace/runtime/moloch-artifacts/0xDAO/proposal-summary.json",
  "processQueuePath": "workspace/runtime/moloch-artifacts/0xDAO/process-queue.json",
  "directStatePath": "workspace/runtime/moloch-artifacts/0xDAO/direct-state.json",
  "lastGraphProposalIdSeen": 12,
  "votingCount": 2,
  "needsProcessingCount": 1,
  "pendingActionCount": 3,
  "status": "fresh"
}
```

Statuses: `fresh`, `stale`, `missing`, `manual`.

## Moloch Skills

Bundled skills:

- `workspace/skills/moloch/moloch-dao-read`
- `workspace/skills/moloch/moloch-agent-conviction`
- `workspace/skills/moloch/moloch-proposals`
- `workspace/skills/moloch/moloch-proposal-actions`
- `workspace/skills/moloch/moloch-summon`
- `workspace/skills/moloch/moloch-shared`
- `workspace/skills/moloch/BOOTSTRAP.md`
- `workspace/skills/moloch/AGENT_TASKS.md`
- `workspace/skills/moloch/SHARED_MEMORY.md`
- `workspace/skills/moloch/VOTE_DECISION_FLOW.md`
- `workspace/skills/moloch/templates/community-memory`

Use `task-snapshot` artifacts for routine review and token-efficient scheduled work. Use direct reads immediately before any write action. Use Graph reads for proposal metadata and original `proposalData`. If the two disagree, prefer direct contract state for timing and permission checks.

For processing, use `process-queue --first 100` or larger. Process only the first item in the queue, then rerun `process-queue` before processing another proposal. When `RPC_URL` is configured, direct `state(id) == Ready` is the source of truth for processability.

Processing is settlement after governance has completed. Do not block processing based on proposal category, value, membership, shares, loot, payments, settings, or mandate preference. The current skill uses an explicit process transaction gas limit: stored `baalGas + 400000`, or `800000` when stored `baalGas` is zero. Use `--gas-limit` only for deliberate overrides.

Membership proposals require extra intent checks:

- Tribute Minion membership uses `releaseEscrow` on `0x00768B047f73D88b6e9c14bcA97221d6E179d468`, then mints shares or loot.
- Direct membership minting calls the Baal DAO with `mintShares(address[],uint256[])` and has no Minion escrow action.
- Before drafting or processing membership proposals, inspect the DAO's join rules and decode a known successful membership proposal from that DAO.
- Do not assume zero-tribute membership should use Tribute Minion. If the DAO expects direct `mintShares`, use `mint-shares`.
- Share and loot quantities are human 18-decimal units by default. `mint-shares --amount 10000` means 10,000 voting shares. Use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.

## Shared Memory

Use `workspace/skills/moloch/SHARED_MEMORY.md` for the current upstream model.

- Local snapshot artifacts are task cache, not durable DAO memory.
- DAO-level coordination should live in Poster records plus IPFS-pinned community memory.
- Bootstrap should create or locate `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI`.
- Start new community memory from `workspace/skills/moloch/templates/community-memory`.
- Use `memory-post` for concise public records and `dao-meta` proposals when DAO metadata pointers need to be published or updated.

## Scheduled Tasks

The manifest declares disabled examples for:

- `bootstrap-dao-agent`
- `proposal-action-watcher`
- `initiative-steward`
- `proposal-generation`

Keep them disabled until the DAO address, mandate, signer, RPC/Graph access, shared-memory plan, and autonomy boundaries are configured. The prompts intentionally defer detailed behavior to `workspace/skills/moloch/AGENT_TASKS.md` so the template follows upstream task updates.

## App Auth

If `APP_PASSWORD` is unset, the app and API work without authentication.

If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the exact `APP_PASSWORD` value as the password.

## Required Secrets

The template declares these required secrets in `manifest.json`:

- `ACCOUNT_ADDRESS`: managed Ethereum account address used for DAO membership, voting power checks, mandate profiles, and audit records.
- `PRIVATE_KEY`: signer key for authorized `--send` actions.
- `RPC_URL`: live chain endpoint used for Baal reads, preflight checks, and transaction broadcasts.
- `PINATA_JWT`: Pinata credential used by `@pinata/api` for shared memory and proposal workspace publishing.
- `PINATA_GATEWAY_URL`: Pinata gateway used by `@pinata/api` for shared memory and proposal workspace reads.

The manifest also documents optional secrets:

- `GRAPH_URL` or `GRAPH_API_KEY`: indexed DAOhaus reads.

Keep secrets in the Pinata secrets vault. Do not write them into workspace files, logs, or chat transcripts.

## Safe Agent Rules

- Confirm ambiguous writes before calling a write route.
- Never delete data without explicit user instruction.
- Never broadcast transactions unless mandate/task/harness policy allows it and live preflight passes.
- Never recommend a vote without a mandate-aware memo.
- Never create new proposals when 3 or more proposals are currently in voting unless the operator explicitly overrides the throttle.
- Never print or store private keys.
- After a write, summarize what changed and point the user back to `/app` for status.
