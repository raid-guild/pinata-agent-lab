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
```

Required env for chain reads:

```bash
export RPC_URL="https://mainnet.base.org"
```

Required env for broadcasting:

```bash
export PRIVATE_KEY="0x..."
```

Do not commit `.env`, private keys, mnemonics, or raw signer credentials.

Derive the hosted `/app` URL from Pinata's injected runtime `HOSTNAME`:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`
