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

Derive the hosted `/app` URL from Pinata's injected runtime `HOSTNAME`:

```bash
node -e "const h=process.env.HOSTNAME||''; const m=h.match(/^(.+)-\\d+$/); console.log(m ? `https://${m[1]}.agents.pinata.cloud/app` : 'Open the /app route from the Pinata Routes tab')"
```

Observed example: `HOSTNAME=xwvqggt3-0` maps to `https://xwvqggt3.agents.pinata.cloud/app`. Use the Routes tab as a fallback only if `HOSTNAME` is missing or does not match the expected pattern.

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

Experimental rebuild hook pattern:

- `pinata-chef` has an experimental authenticated deploy hook pattern for rebuilding an already-running hosted app after repo or workspace changes.
- The pattern is: protected API endpoint -> background script -> `npm run build` -> process reload -> status/log files under `workspace/runtime/`.
- This starter does not expose that endpoint by default because the hosted rebuild behavior still needs more testing and this template currently starts with direct `node server.js`, not PM2.
- If you adapt this starter and need self-rebuild behavior, copy the pattern only after deciding how the app process is managed. With PM2, the reload step can be `npm run pm2:reload`; without PM2, use the platform restart flow or a deliberately tested process manager.
- Keep any rebuild endpoint authenticated, write status/log output to `workspace/runtime/`, reject concurrent rebuilds with a lock file, and avoid exposing arbitrary shell commands.
