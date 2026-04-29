# Scaffold Rules

Use this baseline unless a project-specific reason says otherwise:

- Next.js App Router
- SQLite via `better-sqlite3`
- route path `/app`
- `next.config.mjs` with `basePath: "/app"`
- client fetches to `/app/api/...`
- API routes under `app/api/...`
- explicit `export const runtime = "nodejs"` on SQLite-backed routes
- explicit `export const dynamic = "force-dynamic"` on SQLite-backed routes
- `server.js` bound to `0.0.0.0`
- PM2 runtime through `ecosystem.config.cjs`
- no Pinata scheduled tasks in first pass
- no Tailwind in first pass
- no path aliases
- no external secrets required for first run

Each template should include:

- `manifest.json`
- `README.md`
- `package.json`
- `next.config.mjs`
- `server.js`
- `ecosystem.config.cjs`
- `app/`
- `lib/`
- `workspace/AGENTS.md`
- `workspace/BOOTSTRAP.md`
- `workspace/HEARTBEAT.md`
- `workspace/IDENTITY.md`
- `workspace/SOUL.md`
- `workspace/TOOLS.md`
- `workspace/USER.md`

Validation target:

- `npm install`
- `npm run typecheck`
- `npm run build`
- local `/app` check if practical
- local `/app/health` check if practical

