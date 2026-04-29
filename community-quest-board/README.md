# Community Quest Board

A Pinata-ready coordination template for cohorts, guilds, and project groups that need a simple read-only board for quests, claims, updates, outcomes, and weekly recaps.

The browser UI is a status surface. Chat or agent workflows should write through the local API documented in `workspace/OPERATIONS.md`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

Set `APP_PASSWORD` to require HTTP Basic Auth for `/app` and `/app/api/*`. Any non-empty username is accepted when the password matches `APP_PASSWORD`.

## Validate

```bash
npm run build
npm run typecheck
```

The SQLite database is created at `data/community-quest-board.sqlite` on first use.
