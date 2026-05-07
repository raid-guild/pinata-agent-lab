# Tools

Useful local commands:

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

Useful app routes:

- `/app`
- `/app/api/health`
- `/app/api/governance`
- `/app/api/artifacts`
- `/app/api/daos`
- `/app/api/proposals`
- `/app/api/tasks`
- `/app/api/openclaw/health`
- `/app/api/openclaw/responses`
- `/app/api/openclaw/hooks/:name`

Database:

- SQLite database path: `data/agent-of-moloch.sqlite`
- Schema and seed logic: `lib/db.ts`

Bundled Moloch tools:

```bash
cd workspace/skills/moloch/moloch-shared
npm install
node scripts/moloch.mjs --help
```

Common Moloch reads:

```bash
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --first 100 --out-dir workspace/runtime/moloch-artifacts/0xDAO
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs process-queue --dao 0xDAO --first 100
```

Snapshot artifacts written by `task-snapshot`:

- `direct-state.json`
- `graph-history.json`
- `proposal-summary.json`
- `membership-summary.json`
- `dao-records.json`
- `operating-context.json`
- `process-queue.json`
- `checkpoint.json`

Required env for chain reads:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required env for DAOhaus Graph reads:

```bash
export GRAPH_URL="https://gateway.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

Required template secrets:

```bash
export ACCOUNT_ADDRESS="0x..."
export PRIVATE_KEY="0x..."
```

`ACCOUNT_ADDRESS` is used for voter identity, mandate profiles, and audit records. `PRIVATE_KEY` is used only for authorized `--send` actions.

Do not commit `.env`, private keys, mnemonics, or raw signer credentials.

Derive the hosted `/app` URL from Pinata's injected runtime `HOSTNAME`:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`
