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
- `/app/api/community-memory`
- `/app/api/artifacts`
- `/app/api/sync/dao`
- `/app/api/sync/artifacts`
- `/app/api/sync/memory`
- `/app/api/daos`
- `/app/api/proposals`
- `/app/api/tasks`
- `/app/api/openclaw/health`
- `/app/api/openclaw/responses`
- `/app/api/openclaw/hooks/:name`

Database:

- SQLite database path: `data/agent-of-moloch.sqlite`
- Schema and cache logic: `lib/db.ts`
- Server-side sync logic: `lib/sync.ts`
- Demo rows are opt-in with `SEED_DEMO_DATA=true`

Moloch agent CLI:

```bash
moloch-agent help
moloch-agent health
moloch-agent capabilities
```

Common Moloch reads:

```bash
moloch-agent dao --dao 0xDAO
moloch-agent proposals --dao 0xDAO --first 100
moloch-agent records --dao 0xDAO --table communityMemory --first 100
moloch-agent read-dao --dao 0xDAO
moloch-agent read-proposal --dao 0xDAO --proposal 1
moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
moloch-agent process-queue --dao 0xDAO --first 100
```

Shared-memory and metadata helpers:

```bash
moloch-agent pin-json --file community-state.json --name community-state-v1
moloch-agent dao-meta --dao 0xDAO --community-memory-uri ipfs://CID --proposal-workspace-uri ipfs://CID --shared-state-uri ipfs://CID
moloch-agent memory-post --dao 0xDAO --type communityMemory --thread-id agent-bootstrap --title "Agent mandate and shared memory" --body "Bootstrap pointers and mandate summary."
cp -R workspace/skills/moloch/templates/community-memory workspace/runtime/community-memory/0xDAO
```

Read these before enabling autonomous tasks:

- `workspace/skills/moloch/BOOTSTRAP.md`
- `workspace/skills/moloch/AGENT_TASKS.md`
- `workspace/skills/moloch/SHARED_MEMORY.md`
- `workspace/skills/moloch-agent-simple/SKILL.md`

Service-backed sync cache fields:

- DAO profile from `moloch-agent dao`
- proposal list from `moloch-agent proposals`
- process queue from `moloch-agent process-queue`
- DAO database records from `moloch-agent records`
- direct preflight from `moloch-agent read-dao`, `read-proposal`, and `proposal-lifecycle`

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

Optional env for direct chain reads and sends:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required template secrets:

```bash
export ACCOUNT_ADDRESS="0x..."
export PRIVATE_KEY="0x..."
```

`ACCOUNT_ADDRESS` is used for voter identity, mandate profiles, and audit records. `PRIVATE_KEY` is used only for authorized transaction actions. `RPC_URL` is optional for service-backed reads, but powers direct chain reads, preflight checks, and transaction broadcasts.

Optional template secrets:

```bash
export MOLOCH_SERVICE_URL="https://moloch-service-production.up.railway.app"
export IPFS_GATEWAY_URL="https://gateway.pinata.cloud/ipfs/"
export RPC_URL="https://mainnet.base.org"
export MOLOCH_SEND_DEFAULT="false"
```

Do not commit `.env`, private keys, mnemonics, or raw signer credentials.

Derive the hosted `/app` URL from Pinata's injected runtime `HOSTNAME`:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`
