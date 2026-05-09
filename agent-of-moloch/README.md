# Agent of Moloch

A Pinata-ready governance template for Moloch V3/Baal DAOs.

The app gives the agent a characterful surface: DAO memory, mandate ledger, proposal augury, sync watch, and next rites. Under the flavor, it stays strict about governance operations: read service-backed state, write vote memos, run live preflight, and broadcast only when mandate and harness policy allow it.

## What It Stores

- DAOs with Baal address, chain id, DAOhaus route, charter, thesis, voting power, conviction, and governance mandate
- Proposal records with proposal id, status, stance, confidence, recommended vote, rationale, due date, and tx hash
- Suggested tasks for reading DAO state, checking proposals, voting, sponsoring, processing, and record keeping
- Service-backed DAO/proposal/memory cache powered by `@raidguild/meta-clawtel`
- Primary simple agent skill in `workspace/skills/moloch-agent-simple`
- Default Pinata skills: `@pinata/api` and `@pinata/platform`
- Disabled manifest task examples for proposal watching and proposal generation

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
- `GET /app/api/community-memory`
- `GET /app/api/artifacts`
- `POST /app/api/artifacts`
- `POST /app/api/sync/dao`
- `POST /app/api/sync/artifacts`
- `POST /app/api/sync/memory`
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

## Moloch Agent

Run CLI commands from the template root with `npm exec --` so npm resolves the local package binary even when `node_modules/.bin` is not on the shell PATH.

```bash
npm exec -- moloch-agent help
npm exec -- moloch-agent health
npm exec -- moloch-agent capabilities
```

Useful reads:

```bash
npm exec -- moloch-agent dao --dao 0xDAO
npm exec -- moloch-agent proposals --dao 0xDAO --first 100
npm exec -- moloch-agent records --dao 0xDAO --table communityMemory --first 100
npm exec -- moloch-agent read-dao --dao 0xDAO
npm exec -- moloch-agent read-proposal --dao 0xDAO --proposal 1
npm exec -- moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
npm exec -- moloch-agent process-queue --dao 0xDAO --first 100
```

`@raidguild/meta-clawtel` uses `moloch-service` for DAOhaus Graph reads and Pinata-backed JSON pinning. The service never receives private keys. `RPC_URL` defaults to the public Base RPC; set your own RPC URL for reliable autonomous operation.

Use `workspace/skills/moloch-agent-simple/SKILL.md` as the current operating guide before making vote recommendations or transaction decisions.

Graph-backed commands such as `dao`, `members`, `proposals`, and `records` can fail if the hosted service and subgraph schema drift. Treat that as a service/indexing issue, not proof that the DAO is invalid. Use direct RPC reads like `read-dao`, `read-proposal`, `proposal-lifecycle`, and `process-queue` to verify DAO existence and transaction safety.

For processing, use `process-queue --first 100` or larger, process only the first queue item, then rerun the queue before processing another proposal. Processing is settlement after governance has passed; do not block it because the proposal touches membership, shares, loot, payments, settings, or another sensitive category. The updated skill sets an explicit process transaction gas limit by default: stored `baalGas + 400000`, or `800000` when stored `baalGas` is zero. Override with `--gas-limit` only when needed.

Membership proposal note: Moloch/Baal DAOs may admit members through different executable paths. A Tribute Minion membership proposal includes a Minion `releaseEscrow` action before shares or loot are minted. A direct membership proposal may call the Baal DAO directly with `mintShares(address[],uint256[])` and no Minion escrow action. Before drafting or processing membership proposals, check the DAO's join rules and decode a known successful membership proposal from that DAO. Use `mint-shares --amount 10000` for 10,000 human voting shares; use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.

Optional RPC override:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required template secrets:

```bash
export ACCOUNT_ADDRESS="0x..."
export PRIVATE_KEY="0x..."
```

`ACCOUNT_ADDRESS` is the managed voter/account identity used in mandate profiles and audit records. `PRIVATE_KEY` signs authorized onchain actions. `RPC_URL` is optional because `npm exec -- moloch-agent` defaults to `https://mainnet.base.org`; use a dedicated RPC provider for always-on agents. `MOLOCH_SERVICE_URL`, `IPFS_GATEWAY_URL`, `GRAPH_URL`, `GRAPH_API_KEY`, `PINATA_JWT`, and `PINATA_GATEWAY_URL` are optional runtime settings because the default service-backed flow keeps Graph and Pinata credentials outside the agent runtime. Keep secrets in the Pinata secrets vault; do not commit them to files.

Security note: use a dedicated agent wallet, not a primary personal wallet or treasury hot wallet. Pinata Agents store secrets securely in the agent secrets vault, but any signer that can vote or submit transactions carries operational risk. Fund the wallet only for the permissions and gas budget this agent actually needs, and rotate or revoke access if the mandate changes.

Do not commit `.env` files, private keys, mnemonics, or raw signer credentials.

## Bootstrap And Tasks

First-run setup lives in `workspace/BOOTSTRAP.md`. The bundled simple skill includes reusable scheduled task guidance:

- `workspace/skills/moloch-agent-simple/SKILL.md`

The manifest includes disabled recurring task examples. Enable them only after the DAO address, signer, mandate, autonomy boundaries, service/RPC access, and shared-memory location are configured. Run `workspace/BOOTSTRAP.md` once to create or locate the DAO shared memory root, fill the first `community-state.md`, create the agent mandate, sync the DAO cache, and publish memory pointers when appropriate.

Shared memory is the durable coordination layer for multiple agents. Use `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI` in DAO metadata or memory records, and use the local SQLite cache only as task cache.

New instances start without demo rows. Set `SEED_DEMO_DATA=true` only when you want local placeholder DAOs and proposals for design testing.

The dashboard can be populated from real server-side sync routes. These routes use `@raidguild/meta-clawtel` and `moloch-service`, then cache normalized rows in SQLite for the browser:

```bash
curl -X POST http://localhost:3000/app/api/sync/dao \
  -H 'content-type: application/json' \
  -d '{"daoAddress":"0xDAO","name":"My DAO"}'

curl -X POST http://localhost:3000/app/api/sync/memory \
  -H 'content-type: application/json' \
  -d '{"daoAddress":"0xDAO","table":"communityMemory"}'
```

## Optional App Auth

Set `APP_PASSWORD` to require HTTP Basic Auth for `/app` and `/app/api/*`. Any non-empty username is accepted; the password must match `APP_PASSWORD`.

## OpenClaw Proxy

Optional relays are available when `API_PASSWORD` is set:

- `GET /app/api/openclaw/health`
- `POST /app/api/openclaw/responses` -> `POST /v1/responses`
- `POST /app/api/openclaw/hooks/:name` -> `POST /hooks/:name`

## First Agent Prompt

```text
You are Agent of Moloch. Read workspace/BOOTSTRAP.md, workspace/IDENTITY.md, workspace/OPERATIONS.md, workspace/TOOLS.md, and workspace/skills/moloch-agent-simple/SKILL.md. Ask me which DAOs you are in, what each DAO's charter/thesis is, what governance mandate you should hold, and which moloch-service/shared-memory pointers should be used before checking proposals or preparing votes.
```
