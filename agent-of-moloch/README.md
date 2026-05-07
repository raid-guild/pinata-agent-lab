# Agent of Moloch

A Pinata-ready governance template for Moloch V3/Baal DAOs.

The app gives the agent a characterful surface: DAO memory, mandate ledger, proposal augury, checkpoint watch, and next rites. Under the flavor, it stays strict about governance operations: read snapshot artifacts, write vote memos, run live preflight, and broadcast only when mandate and harness policy allow it.

## What It Stores

- DAOs with Baal address, chain id, DAOhaus route, charter, thesis, voting power, conviction, and governance mandate
- Proposal records with proposal id, status, stance, confidence, recommended vote, rationale, due date, and tx hash
- Suggested tasks for reading DAO state, checking proposals, voting, sponsoring, processing, and record keeping
- Snapshot artifact records for `task-snapshot` checkpoint outputs
- Bundled Moloch skills aligned with `https://github.com/HausDAO/moloch-skills` in `workspace/skills/moloch`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

In a hosted Pinata instance, derive the public `/app` URL from `HOSTNAME` when possible. A runtime hostname like `xwvqggt3-0` maps to `https://xwvqggt3.agents.pinata.cloud/app`.

## Validate

```bash
npm run build
npm run typecheck
```

## API

- `GET /app/api/governance`
- `GET /app/api/governance?status=voting`
- `GET /app/api/artifacts`
- `POST /app/api/artifacts`
- `GET /app/api/daos`
- `POST /app/api/daos`
- `PATCH /app/api/daos/:id`
- `DELETE /app/api/daos/:id`
- `GET /app/api/proposals`
- `POST /app/api/proposals`
- `PATCH /app/api/proposals/:id`
- `DELETE /app/api/proposals/:id`
- `GET /app/api/tasks`
- `POST /app/api/tasks`
- `PATCH /app/api/tasks/:id`
- `DELETE /app/api/tasks/:id`
- `GET /app/api/health`

## Moloch Skills

Install shared script dependencies when you need chain or DAOhaus reads:

```bash
cd workspace/skills/moloch/moloch-shared
npm install
node scripts/moloch.mjs --help
```

Useful reads:

```bash
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --first 100 --out-dir workspace/runtime/moloch-artifacts/0xDAO
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
```

`task-snapshot` writes the artifacts shown on the dashboard:

- `direct-state.json`
- `proposal-summary.json`
- `operating-context.json`
- `process-queue.json`
- `checkpoint.json`

Use `workspace/skills/moloch/moloch-agent-conviction` and `workspace/skills/moloch/VOTE_DECISION_FLOW.md` before making vote recommendations.

For processing, use `process-queue --first 100` or larger, process only the first queue item, then rerun the queue before processing another proposal.

Membership proposal note: Moloch/Baal DAOs may admit members through different executable paths. A Tribute Minion membership proposal includes a Minion `releaseEscrow` action before shares or loot are minted. A direct membership proposal may call the Baal DAO directly with `mintShares(address[],uint256[])` and no Minion escrow action. Before drafting or processing membership proposals, check the DAO's join rules and decode a known successful membership proposal from that DAO. Do not force `join-dao` / Tribute Minion when the DAO expects direct `mintShares`.

Required for chain reads:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required template secrets:

```bash
export ACCOUNT_ADDRESS="0x..."
export PRIVATE_KEY="0x..."
```

`ACCOUNT_ADDRESS` is the managed voter/account identity used in mandate profiles and audit records. `PRIVATE_KEY` signs authorized onchain actions. Keep both in the Pinata secrets vault; do not commit them to files.

Security note: use a dedicated agent wallet, not a primary personal wallet or treasury hot wallet. Pinata Agents store secrets securely in the agent secrets vault, but any signer that can vote or submit transactions carries operational risk. Fund the wallet only for the permissions and gas budget this agent actually needs, and rotate or revoke access if the mandate changes.

Do not commit `.env` files, private keys, mnemonics, or raw signer credentials.

## Optional App Auth

Set `APP_PASSWORD` to require HTTP Basic Auth for `/app` and `/app/api/*`. Any non-empty username is accepted; the password must match `APP_PASSWORD`.

## OpenClaw Proxy

Optional relays are available when `API_PASSWORD` is set:

- `GET /app/api/openclaw/health`
- `POST /app/api/openclaw/responses` -> `POST /v1/responses`
- `POST /app/api/openclaw/hooks/:name` -> `POST /hooks/:name`

## First Agent Prompt

```text
You are Agent of Moloch. Read workspace/BOOTSTRAP.md, workspace/IDENTITY.md, workspace/OPERATIONS.md, workspace/TOOLS.md, workspace/skills/moloch/AGENT_TASKS.md, workspace/skills/moloch/VOTE_DECISION_FLOW.md, and the Moloch skills under workspace/skills/moloch. Ask me which DAOs you are in, what each DAO's charter/thesis is, what governance mandate you should hold, and where task-snapshot artifacts should be written before checking proposals or preparing votes.
```
