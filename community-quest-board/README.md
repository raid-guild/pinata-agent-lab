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

## OpenClaw Proxy

This template includes optional relays for the local OpenClaw gateway:

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

## Validate

```bash
npm run build
npm run typecheck
```

The SQLite database is created at `data/community-quest-board.sqlite` on first use.
