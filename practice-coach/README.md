# Personal Practice Coach

A small Pinata-ready practice companion for tracking goals, sessions, streaks, reflections, and next-session plans across music, writing, fitness, language learning, drawing, or similar disciplines.

The browser dashboard at `/app` is read-only. Chat/agent workflows write through the local API routes documented in `workspace/OPERATIONS.md`.

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

The SQLite database is created at `data/practice-coach.sqlite` on first use.
