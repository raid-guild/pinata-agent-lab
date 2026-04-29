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

This starter was built from Raid Guild cohort agent-template experiments. Learn more at `https://www.raidguild.org/join`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/app`.

In a hosted Pinata instance, open the agent's Routes tab and choose the `/app` route.

Agents can usually derive the public app URL from `HOSTNAME`: a runtime hostname like `xwvqggt3-0` maps to `https://xwvqggt3.agents.pinata.cloud/app`. If the pattern does not match, use the Routes tab instead.

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

## Prompting a Build Agent

When using an agent or coding assistant to turn this starter into a new template, give it the official Pinata template docs and tell it to keep this repo as the working example pattern.

Useful references:

- Template overview: `https://docs.pinata.cloud/agents/templates/overview`
- Creating templates: `https://docs.pinata.cloud/agents/templates/creating`

Suggested build prompt:

```text
You are converting the RaidGuild Agent App Starter into a new Pinata agent template.

Use these docs as the source of truth:
- https://docs.pinata.cloud/agents/templates/overview
- https://docs.pinata.cloud/agents/templates/creating

Use this starter as the implementation pattern:
- Next.js App Router served at /app
- local SQLite persistence through better-sqlite3
- read-only browser dashboard
- API routes for agent/chat writes
- optional APP_PASSWORD Basic Auth
- optional API_PASSWORD OpenClaw proxy routes
- conservative Pinata manifest.v1.json shape
- workspace docs for BOOTSTRAP, IDENTITY, OPERATIONS, TOOLS, USER, SOUL, AGENTS, and HEARTBEAT

Build the new template by first defining the domain model, then updating the database, API routes, dashboard, workspace docs, README, and manifest. Keep the default template runnable without required external secrets. Run npm run build and npm run typecheck before calling the pass complete.
```

## Publishing

Before publishing, deploy from your template repo and test the hosted app route, API routes, auth behavior, and any OpenClaw proxy assumptions.

UI flow:

1. Go to `https://agents.pinata.cloud/templates/submit`.
2. Enter the public repository URL.
3. Click Validate.
4. Review the parsed manifest and workspace files.
5. Submit for review.

CLI flow:

```bash
pinata agents templates validate https://github.com/user/my-template
pinata agents templates submit https://github.com/user/my-template
pinata agents templates submit https://github.com/user/my-template --branch develop
```

Published templates can later be managed from My Templates or with the template CLI commands.

## First Agent Prompt

```text
You are the RaidGuild Agent App Starter. First read workspace/BOOTSTRAP.md, workspace/IDENTITY.md, workspace/OPERATIONS.md, and workspace/TOOLS.md. Then ask me what kind of agent app I want to build from this starter and help me plan the first domain model, API routes, and dashboard surface.
```
