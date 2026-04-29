# Operations

Community Quest Board is chat-first. The browser at `/app` is read-only, while the agent may use the API to keep SQLite current.

## Reads

### Health

`GET /app/api/health`

Returns:

```json
{
  "ok": true,
  "service": "community-quest-board"
}
```

### Quest bundle

`GET /app/api/quests`

Returns all quests, a selected quest, updates for the selected quest, and weekly recap data.

Optional query:

`GET /app/api/quests?questId=2`

Use this when the user asks about one quest or after writing an update.

## Writes

### Update a quest

`POST /app/api/updates`

Expected JSON:

```json
{
  "questId": 2,
  "author": "Steward",
  "body": "Draft recap is ready for steward review.",
  "status": "review",
  "owner": "Devon",
  "outcome": "Draft recap is ready for steward review."
}
```

Fields:

- `questId` is required.
- `body` is required and should be a concise progress note, blocker, ask, review note, or completion note.
- `status` accepts `open`, `claimed`, `review`, or `done`. Unknown values are normalized to `open`.
- `author` defaults to `Steward` when blank.
- `owner` may be a person, team, role, or blank for unclaimed work.
- `outcome` should stay blank until there is a concrete result or review-ready artifact.

Response:

The route returns the refreshed quest bundle for the updated quest.

## Basic Auth

If `APP_PASSWORD` is unset, the app and API work without authentication.

If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the exact `APP_PASSWORD` value as the password.

Example:

```bash
curl -u steward:$APP_PASSWORD http://localhost:3000/app/api/quests
```

## OpenClaw Proxy

Optional OpenClaw relays are available when `API_PASSWORD` is set:

- `GET /app/api/openclaw/health`
- `POST /app/api/openclaw/responses` relays to `POST /v1/responses`
- `POST /app/api/openclaw/hooks/:name` relays to `POST /hooks/:name`

Accepted proxy auth:

- `Authorization: Bearer <API_PASSWORD>`
- `x-api-password: <API_PASSWORD>`

The proxy defaults to `http://127.0.0.1:18789`; override with `OPENCLAW_BASE_URL`. If `OPENCLAW_GATEWAY_TOKEN` is set, it is forwarded to `/v1/responses` as bearer auth. The instance `openclaw.json` must enable the responses endpoint and any hook/webhook support before these relays can reach the gateway.

## Safe Agent Rules

- Treat chat as the write interface and `/app` as a read-only status surface.
- Never invent an owner, shipped outcome, or status transition when the user did not imply it.
- Ask a short clarifying question if a message could update multiple quests.
- Prefer small factual update bodies over copied chat transcripts.
- Keep `done` for quests with a concrete result recorded in `outcome`.
- Do not create scheduled tasks, external service dependencies, or required secrets for default operation.
