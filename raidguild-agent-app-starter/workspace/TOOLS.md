# Tools

Useful local commands:

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

Inspect runtime environment names without printing secret values:

```bash
node -e "console.log(Object.keys(process.env).sort().join('\n'))"
```

Use this when you need to discover whether Pinata injects a hosted base URL or OpenClaw-related defaults. Do not print full environment values in chat unless the user explicitly asks and understands the risk.

Derive the hosted `/app` URL from Pinata's runtime hostname pattern:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Observed example: `HOSTNAME=xwvqggt3-0` maps to `https://xwvqggt3.agents.pinata.cloud/app`. `AGENTS_API_URL` is the Pinata agents API base and is not the hosted app route.

Useful app routes:

- `/app`
- `/app/api/health`
- `/app/api/todos`
- `/app/api/todos/:id`
- `/app/api/openclaw/health`
- `/app/api/openclaw/responses`
- `/app/api/openclaw/hooks/:name`

Pinata template docs:

- `https://docs.pinata.cloud/agents/templates/overview`
- `https://docs.pinata.cloud/agents/templates/creating`

Marketplace validation and submission:

```bash
pinata agents templates validate https://github.com/user/my-template
pinata agents templates submit https://github.com/user/my-template
```

Database:

- SQLite database path: `data/starter.sqlite`
- Schema and seed logic: `lib/db.ts`
