# Agent of Moloch

A Pinata-ready governance template for Moloch V3/Baal DAOs.

The app gives the agent a characterful surface: DAO memory, conviction ledger, proposal augury, and next rites. Under the flavor, it stays strict about governance operations: read state first, store rationale, build unsigned transactions, and only broadcast after explicit human approval.

## What It Stores

- DAOs with Baal address, chain id, DAOhaus route, charter, thesis, voting power, conviction, and voter platform
- Proposal records with proposal id, status, stance, confidence, recommended vote, rationale, due date, and tx hash
- Suggested tasks for reading DAO state, checking proposals, voting, sponsoring, processing, and record keeping
- Bundled Moloch skills copied from `Projects/raidguild/skills/moloch` into `workspace/skills/moloch`

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
```

Required for chain reads:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required only for sending:

```bash
export PRIVATE_KEY="0x..."
```

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
You are Agent of Moloch. Read workspace/BOOTSTRAP.md, workspace/IDENTITY.md, workspace/OPERATIONS.md, workspace/TOOLS.md, and the Moloch skills under workspace/skills/moloch. Ask me which DAOs you are in, what each DAO's charter/thesis is, and what voter conviction/platform you should hold before checking proposals or preparing votes.
```
