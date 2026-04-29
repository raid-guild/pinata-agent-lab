# Micro CRM for Solo Operators

A small Pinata-ready CRM template for tracking contacts, notes, next actions, pipeline status, and draft follow-up suggestions.

The browser dashboard is read-only. Use chat/agent API calls to add notes, update next actions, and store draft follow-ups.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

Set `APP_PASSWORD` to require HTTP Basic Auth for `/app` and `/app/api/*`. Any non-empty username is accepted; the password must match `APP_PASSWORD`.

## Validate

```bash
npm run build
npm run typecheck
```

The SQLite database is created at `data/micro-crm.sqlite` on first use.
