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

Returns DAOs, proposal records, suggested tasks, sync checkpoints, DAO database memory records, and summary stats for the dashboard.

## Sync

```http
POST /app/api/sync/dao
POST /app/api/sync/artifacts
POST /app/api/sync/memory
GET /app/api/community-memory
```

Sync routes are server-side only. They use `@raidguild/meta-clawtel` and `moloch-service`, then write normalized cache rows to SQLite for the dashboard. `npm exec -- moloch-agent` defaults to the public Base RPC; set `RPC_URL` only when you need a more reliable provider.

Example DAO sync payload:

```json
{
  "daoAddress": "0x...",
  "name": "Example DAO",
  "first": 100
}
```

Example memory sync payload:

```json
{
  "daoAddress": "0x...",
  "table": "communityMemory"
}
```

New instances do not seed demo data unless `SEED_DEMO_DATA=true`.

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
  "communityMemoryUri": "ipfs://...",
  "proposalWorkspaceUri": "ipfs://...",
  "sharedStateUri": "ipfs://...",
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

## Sync Checkpoints

```http
GET /app/api/artifacts
POST /app/api/artifacts
```

Use this route to record service-backed sync checkpoint metadata for a DAO. `/app/api/sync/dao` updates this automatically.

Example payload:

```json
{
  "daoId": 1,
  "artifactDir": "moloch-service:default",
  "checkpointPath": "service:dao/proposals/process-queue",
  "operatingContextPath": "service:dao/records/daoProfile",
  "proposalSummaryPath": "service:dao/proposals",
  "processQueuePath": "service:dao/process-queue",
  "directStatePath": "rpc:read-dao",
  "lastGraphProposalIdSeen": 12,
  "votingCount": 2,
  "needsProcessingCount": 1,
  "pendingActionCount": 3,
  "status": "fresh"
}
```

Statuses: `fresh`, `stale`, `missing`, `manual`.

## Moloch Runtime

Primary runtime:

- `@raidguild/meta-clawtel`
- `npm exec -- moloch-agent`
- `workspace/skills/moloch-agent-simple/SKILL.md`

Use service-backed sync for routine review and token-efficient scheduled work. Use direct reads immediately before any write action. `moloch-service` provides indexed proposal metadata and original `proposalData`; direct contract state still wins for timing and permission checks.

For processing, use `process-queue --first 100` or larger. Process only the first item in the queue, then rerun `process-queue` before processing another proposal. Direct `state(id) == Ready` is the source of truth for processability.

Processing is settlement after governance has completed. Do not block processing based on proposal category, value, membership, shares, loot, payments, settings, or mandate preference. `process-ready` and `process-queue` use an explicit process transaction gas limit based on stored `baalGas`, with fallback behavior from `@raidguild/meta-clawtel`.

Membership proposals require extra intent checks:

- Tribute Minion membership uses `releaseEscrow` on `0x00768B047f73D88b6e9c14bcA97221d6E179d468`, then mints shares or loot.
- Direct membership minting calls the Baal DAO with `mintShares(address[],uint256[])` and has no Minion escrow action.
- Before drafting or processing membership proposals, inspect the DAO's join rules and decode a known successful membership proposal from that DAO.
- Do not assume zero-tribute membership should use Tribute Minion. If the DAO expects direct `mintShares`, use `mint-shares`.
- Share and loot quantities are human 18-decimal units by default. `mint-shares --amount 10000` means 10,000 voting shares. Use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.

## Shared Memory

- Local sync cache is task cache, not durable DAO memory.
- DAO-level coordination should live in Poster records plus IPFS-pinned community memory.
- Bootstrap should create or locate `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI`.
- Use `memory-post` for concise public records and `dao-meta` proposals when DAO metadata pointers need to be published or updated.

## Scheduled Tasks

The manifest declares disabled examples for:

- `proposal-action-watcher`
- `proposal-generation`

Bootstrap is a one-time flow in `workspace/BOOTSTRAP.md`, not a scheduled manifest task. Keep recurring tasks disabled until the DAO address, mandate, signer, service access, shared-memory plan, and autonomy boundaries are configured. The prompts intentionally defer detailed behavior to `workspace/skills/moloch-agent-simple/SKILL.md`.

## App Auth

If `APP_PASSWORD` is unset, the app and API work without authentication.

If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the exact `APP_PASSWORD` value as the password.

## Required Secrets

The template declares these required secrets in `manifest.json`:

- `ACCOUNT_ADDRESS`: managed Ethereum account address used for DAO membership, voting power checks, mandate profiles, and audit records.
- `PRIVATE_KEY`: signer key for authorized `--send` actions.
- Optional settings include `MOLOCH_SERVICE_URL`, `IPFS_GATEWAY_URL`, `MOLOCH_SEND_DEFAULT`, and legacy direct Graph/Pinata variables.
- `RPC_URL` is optional. `npm exec -- moloch-agent` defaults to `https://mainnet.base.org`; set `RPC_URL` for reliable direct Baal reads, live preflight, and transaction broadcasts.

Keep secrets in the Pinata secrets vault. Do not write them into workspace files, logs, or chat transcripts.

## Safe Agent Rules

- Confirm ambiguous writes before calling a write route.
- Never delete data without explicit user instruction.
- Never broadcast transactions unless mandate/task/harness policy allows it and live preflight passes.
- Never recommend a vote without a mandate-aware memo.
- Never create new proposals when 3 or more proposals are currently in voting unless the operator explicitly overrides the throttle.
- Never print or store private keys.
- After a write, summarize what changed and point the user back to `/app` for status.
