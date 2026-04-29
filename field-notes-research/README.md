# Field Notes Research Agent

A Pinata-ready, chat-first research dossier for observations, sources, tags, quotes, themes, follow-up questions, and a report-ready summary draft.

The browser dashboard at `/app` is read-only. Agents and chat workflows can write notes through `POST /app/api/research`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

## Auth

Set `APP_PASSWORD` to require HTTP Basic Auth on `/app` and `/app/api/*`. Any non-empty username is accepted when the password matches.

## Validate

```bash
npm run build
npm run typecheck
```

The SQLite database is created at `data/field-notes-research.sqlite` on first use.
