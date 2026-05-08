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

Shared-memory and metadata helpers:

```bash
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs dao-meta --dao 0xDAO --community-memory-uri ipfs://CID --proposal-workspace-uri ipfs://CID --shared-state-uri ipfs://CID
node workspace/skills/moloch/moloch-shared/scripts/moloch.mjs memory-post --dao 0xDAO --type communityMemory --thread-id agent-bootstrap --title "Agent mandate and shared memory" --content "Bootstrap pointers and mandate summary."
cp -R workspace/skills/moloch/templates/community-memory workspace/runtime/community-memory/0xDAO
```

Read these before enabling autonomous tasks:

- `workspace/skills/moloch/BOOTSTRAP.md`
- `workspace/skills/moloch/AGENT_TASKS.md`
- `workspace/skills/moloch/SHARED_MEMORY.md`

Snapshot artifacts written by `task-snapshot`:

- `direct-state.json`
- `graph-history.json`
- `proposal-summary.json`
- `membership-summary.json`
- `dao-records.json`
- `operating-context.json`
- `process-queue.json`
- `checkpoint.json`

Processing note:

- Use `process-queue --first 100` or larger for watcher tasks.
- Process the first queue item only, then rerun the queue before processing another proposal.
- With `RPC_URL` configured, direct `state(id) == Ready` is the processability source of truth.
- Processing is settlement, not a second mandate vote. Do not block it based on proposal category.
- The `process` command sets an explicit gas limit by default: stored `baalGas + 400000`, or `800000` when stored `baalGas` is zero. Override with `--gas-limit`.

Membership proposal path check:

- Tribute Minion path: decoded actions include `releaseEscrow` on `0x00768B047f73D88b6e9c14bcA97221d6E179d468`.
- Direct Baal mint path: decoded actions include `mintShares(address[],uint256[])` on the DAO address with no Minion escrow.
- Decode known successful membership proposals for the DAO before drafting or processing a new membership proposal.
- `mint-shares --amount 10000` means 10,000 voting shares. Use raw flags only for exact base units.

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
export RPC_URL="https://mainnet.base.org"
export PINATA_JWT="..."
export PINATA_GATEWAY_URL="https://gateway.pinata.cloud"
```

`ACCOUNT_ADDRESS` is used for voter identity, mandate profiles, and audit records. `PRIVATE_KEY` is used only for authorized `--send` actions. `RPC_URL` powers live reads, preflight checks, and transaction broadcasts.

Optional template secrets:

```bash
export GRAPH_URL="https://gateway.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
export GRAPH_API_KEY="..."
```

Do not commit `.env`, private keys, mnemonics, or raw signer credentials.

Derive the hosted `/app` URL from Pinata's injected runtime `HOSTNAME`:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`
