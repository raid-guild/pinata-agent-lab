# Memory Garden

A Pinata-ready personal knowledge template where notes, links, ideas, and reflections grow into visual topic clusters over time. The browser dashboard is read-only; chat/agent writes use the local API routes described in `workspace/OPERATIONS.md`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

Set `APP_PASSWORD` to require HTTP Basic Auth on `/app` and `/app/api/*`. Any non-empty username is accepted when the password matches.

## Validate

```bash
npm run build
npm run typecheck
```

The SQLite database is created at `data/memory-garden.sqlite` on first use.
