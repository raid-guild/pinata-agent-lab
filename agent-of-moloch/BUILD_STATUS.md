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
- The current runtime uses `@raidguild/meta-clawtel@0.3.0` with `moloch-service` for Graph reads and Pinata-backed pinning.
- The legacy Moloch skill bundle remains available as reference material and is aligned with `HausDAO/moloch-skills` commit `d4afd27a8729cba2332b63ea21b516dc487d3ade`.
- `APP_PASSWORD` is optional.
- `API_PASSWORD` is optional and enables OpenClaw proxy routes.

Validation completed locally on 2026-05-08:

- `npm run build`
- `npm run typecheck`
