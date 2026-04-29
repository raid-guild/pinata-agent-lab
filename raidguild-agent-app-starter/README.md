# RaidGuild Agent App Starter

A small Pinata-ready starter for building hosted agent apps with Next.js, SQLite, optional password auth, and optional OpenClaw response/webhook proxy routes.

The included todo app is intentionally plain. Its job is to show the deployable pattern:

- read-only dashboard at `/app`
- SQLite persistence in `data/starter.sqlite`
- CRUD API routes under `/app/api/todos`
- optional `APP_PASSWORD` Basic Auth
- optional `API_PASSWORD` gated OpenClaw proxy routes
- Pinata v1 `manifest.json`
- workspace docs for agent identity, bootstrap, and operations

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

## Validate

```bash
npm run build
npm run typecheck
```

## Todo API

- `GET /app/api/todos`
- `GET /app/api/todos?status=open`
- `POST /app/api/todos`
- `PATCH /app/api/todos/:id`
- `DELETE /app/api/todos/:id`
- `GET /app/api/health`

Example create:

```bash
curl -X POST http://localhost:3000/app/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Replace the starter schema","body":"Model the records your agent app should manage.","priority":"high","dueDate":"2026-04-30"}'
```

Example update:

```bash
curl -X PATCH http://localhost:3000/app/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

## Optional App Auth

Set `APP_PASSWORD` to require HTTP Basic Auth for `/app` and `/app/api/*`. Any non-empty username is accepted; the password must match `APP_PASSWORD`.

Leave `APP_PASSWORD` unset for local development or public demo instances.

## OpenClaw Proxy

This starter includes optional relays for the local OpenClaw gateway:

- `GET /app/api/openclaw/health`
- `POST /app/api/openclaw/responses` -> `POST /v1/responses`
- `POST /app/api/openclaw/hooks/:name` -> `POST /hooks/:name`

The proxy is disabled unless `API_PASSWORD` is set in the runtime environment. When enabled, call it with either header:

- `Authorization: Bearer <API_PASSWORD>`
- `x-api-password: <API_PASSWORD>`

Optional env:

- `OPENCLAW_BASE_URL`: defaults to `http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN`: forwarded as bearer auth for `/v1/responses` when present

To use these routes in a Pinata instance, enable the matching OpenClaw HTTP features in `openclaw.json`. At minimum, enable the responses endpoint:

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "responses": {
          "enabled": true
        }
      }
    }
  }
}
```

Also enable webhook/hooks support for any named hook you want to relay through `/app/api/openclaw/hooks/:name`. Keep `API_PASSWORD` out of `manifest.json`; set it directly in the instance environment when you want the proxy online.

## Adapting This Starter

Good first changes:

1. Rename the app and update `manifest.json`.
2. Replace the todo schema in `lib/db.ts`.
3. Replace `/app/api/todos` with your domain routes.
4. Keep the dashboard read-only.
5. Update `workspace/OPERATIONS.md` so the agent knows how to call your APIs.
6. Keep the manifest minimal until Pinata deploy validation confirms extra fields are supported.

## First Agent Prompt

```text
You are the RaidGuild Agent App Starter. First read workspace/BOOTSTRAP.md, workspace/IDENTITY.md, workspace/OPERATIONS.md, and workspace/TOOLS.md. Then ask me what kind of agent app I want to build from this starter and help me plan the first domain model, API routes, and dashboard surface.
```
