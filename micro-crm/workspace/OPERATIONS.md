# Operations

The browser dashboard at `/app` is read-only. Agents may read from the API and may write only after a chat instruction or an explicit setup decision from the user.

## Read Routes

### `GET /app/api/health`

Returns service health and initializes SQLite if needed.

Response:

```json
{ "ok": true, "service": "micro-crm" }
```

### `GET /app/api/contacts`

Returns the relationship portfolio, selected contact, selected contact notes, selected contact drafts, and due follow-ups.

Optional query:

- `contactId`: numeric contact id to select.

Example:

```bash
curl http://127.0.0.1:3000/app/api/contacts?contactId=1
```

## Write Routes

### `POST /app/api/contacts`

Adds a note for an existing contact and updates that contact's next action, next action date, and last-contacted date.

Payload:

```json
{
  "contactId": 1,
  "body": "Asked for a smaller first milestone and clearer weekly reporting.",
  "nextAction": "Send revised scope",
  "nextActionDate": "2026-04-30"
}
```

Rules:

- `contactId` is required.
- `body` must be a non-empty relationship note.
- Use ISO dates in `YYYY-MM-DD` format for `nextActionDate`.
- Keep notes factual. Do not invent commitments, dates, or sentiment.

### `POST /app/api/suggestions`

Stores a draft follow-up for an existing contact.

Payload:

```json
{
  "contactId": 1,
  "body": "Hi Avery, following up with two smaller milestone options..."
}
```

Rules:

- `contactId` is required.
- `body` must be non-empty.
- Drafts should match the user's requested tone.
- Drafts are stored for review; do not claim that a message was sent.

## Authentication

If `APP_PASSWORD` is unset, the app and API are open locally. If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the configured password.

Example:

```bash
curl -u operator:$APP_PASSWORD http://127.0.0.1:3000/app/api/contacts
```

## Safe Agent Rules

- Confirm ambiguous names before writing.
- Prefer one clear next action per contact.
- Use exact dates when the user gives them; otherwise ask before scheduling.
- Never delete data through ad hoc database changes.
- Never bypass the API for routine operations.
- After a write, summarize the contact updated, the note or draft stored, and the next action now shown on the dashboard.
