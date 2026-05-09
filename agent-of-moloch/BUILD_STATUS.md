# Build Status

Status: complete.

Validation targets:

- `npm run build`
- `npm run typecheck`
- local `/app`
- `GET /app/api/health`
- `GET /app/api/governance`
- `GET /app/api/artifacts`
- `GET /app/api/community-memory`
- `POST /app/api/sync/dao`
- `POST /app/api/sync/artifacts`
- `POST /app/api/sync/memory`
- `GET /app/api/daos`
- `GET /app/api/proposals`
- `GET /app/api/tasks`

Notes:

- The dashboard is read-only.
- Governance writes are available through API routes.
- The current runtime uses `@raidguild/meta-clawtel@0.3.1` with `moloch-service` for Graph reads and Pinata-backed pinning.
- The template uses `workspace/skills/moloch-agent-simple/SKILL.md`; the old bundled `moloch-skills` tree has been removed.
- `APP_PASSWORD` is optional.
- `API_PASSWORD` is optional and enables OpenClaw proxy routes.

Validation completed locally on 2026-05-08:

- `npm run build`
- `npm run typecheck`
