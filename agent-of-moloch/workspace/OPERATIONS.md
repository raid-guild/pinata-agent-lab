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

Returns DAOs, proposal records, suggested tasks, and summary stats for the dashboard.

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
  "daohausUrl": "https://admin.daohaus.fun/#/molochv3/0x2105/0x...",
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

## Moloch Skills

Bundled skills:

- `workspace/skills/moloch/moloch-dao-read`
- `workspace/skills/moloch/moloch-proposals`
- `workspace/skills/moloch/moloch-proposal-actions`
- `workspace/skills/moloch/moloch-summon`
- `workspace/skills/moloch/moloch-shared`

Use direct reads immediately before any write action. Use Graph reads for proposal metadata and original `proposalData`. If the two disagree, prefer direct contract state for timing and permission checks.

## App Auth

If `APP_PASSWORD` is unset, the app and API work without authentication.

If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the exact `APP_PASSWORD` value as the password.

## Safe Agent Rules

- Confirm ambiguous writes before calling a write route.
- Never delete data without explicit user instruction.
- Never broadcast transactions without explicit user instruction.
- Never print or store private keys.
- After a write, summarize what changed and point the user back to `/app` for status.
