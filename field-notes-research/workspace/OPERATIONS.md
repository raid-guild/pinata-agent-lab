# Operations

The browser dashboard at `/app` is read-only. Agents may read from the API and may write only after a chat instruction or an explicit setup decision from the user.

## Read Routes

### `GET /app/api/health`

Returns service health and initializes SQLite if needed.

Response:

```json
{ "ok": true, "service": "field-notes-research" }
```

### `GET /app/api/research`

Returns notes, themes, sources, tags, and the current summary draft.

Optional query parameters:

- `source`: exact source name to filter by.
- `tag`: tag text to filter by.

Example:

```bash
curl "http://127.0.0.1:3000/app/api/research?tag=onboarding"
```

## Write Routes

### `POST /app/api/research`

Adds a sourced field note. This route is preserved for chat and agent use; the browser UI must not call it.

Payload:

```json
{
  "title": "Onboarding call friction",
  "source": "Community Ops Interview",
  "sourceType": "Interview",
  "body": "New members understand the mission but hesitate when the first contribution path is buried across several channels.",
  "quote": "I want to help, but I do not know which thread is the real starting point.",
  "tags": "onboarding, contribution, discord",
  "theme": "First contribution clarity",
  "followUp": "Ask which signal would make the first useful action obvious."
}
```

Rules:

- `body` is required and must be a non-empty observation.
- If `title` is missing, the API stores `Untitled field note`.
- If `theme` is missing, the API stores `Unsorted signals`.
- Use comma-separated `tags`.
- Preserve the user's source names and quotes as supplied.
- Keep `followUp` as a question or next research prompt, not a task assignment unless the user asked for one.

## Authentication

If `APP_PASSWORD` is unset, the app and API are open locally. If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the configured password.

Example:

```bash
curl -u operator:$APP_PASSWORD http://127.0.0.1:3000/app/api/research
```

## Safe Agent Rules

- Confirm ambiguous source attribution before writing.
- Never invent direct quotes.
- Prefer factual observation text over interpretation-heavy notes.
- Keep tags stable; add new tags only when they clarify retrieval.
- Never delete data through ad hoc database changes.
- Never bypass the API for routine operations.
- After a write, summarize what changed and invite the user to review the read-only dossier.
