# Operations

The browser dashboard at `/app` is read-only. Agents may write through the local API routes after the user asks for a change.

## Health

```http
GET /app/api/health
```

Returns:

```json
{ "ok": true, "service": "raidguild-agent-app-starter" }
```

## Read Todos

```http
GET /app/api/todos
GET /app/api/todos?status=open
GET /app/api/todos?status=doing
GET /app/api/todos?status=done
```

Returns:

```json
{
  "todos": [],
  "stats": {
    "total": 0,
    "open": 0,
    "doing": 0,
    "done": 0,
    "highPriority": 0
  }
}
```

## Create Todo

```http
POST /app/api/todos
Content-Type: application/json
```

Payload:

```json
{
  "title": "Replace the starter schema",
  "body": "Model the records your agent app should manage.",
  "priority": "high",
  "dueDate": "2026-04-30"
}
```

Rules:

- `title` is required.
- `priority` accepts `low`, `normal`, or `high`.
- New todos default to `open`.

## Update Todo

```http
PATCH /app/api/todos/:id
Content-Type: application/json
```

Payload:

```json
{
  "status": "done"
}
```

Rules:

- `status` accepts `open`, `doing`, or `done`.
- `priority` accepts `low`, `normal`, or `high`.
- Blank titles are rejected.

## Delete Todo

```http
DELETE /app/api/todos/:id
```

Use deletes only when the user explicitly asks to remove a record.

## App Auth

If `APP_PASSWORD` is unset, the app and API work without authentication.

If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the exact `APP_PASSWORD` value as the password.

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

- Confirm ambiguous writes before calling a write route.
- Never invent completed work.
- Never delete data without explicit user instruction.
- Do not bypass the API for routine operations.
- After a write, summarize what changed and point the user back to `/app` for status.
