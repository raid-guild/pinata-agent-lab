# Pinata Template Lab Flow Notes

Date: 2026-04-29

These notes summarize the flow used to create and iterate on the Pinata template lab examples:

- RaidGuild Agent App Starter
- Micro CRM for Solo Operators
- Personal Practice Coach
- Field Notes Research Agent
- Memory Garden
- Community Quest Board

## Starting Goal

The lab tested whether Codex could scaffold multiple Pinata agent templates with minimal intervention, then iterate them into more useful examples. The target pattern was:

- a hosted read-only `/app` dashboard
- SQLite persistence in the template workspace
- local API routes that the agent can use for writes
- chat-first setup and operation
- Pinata-compatible manifest and route configuration
- no required external services for default operation

The experiment intentionally avoided crypto-specific mechanics and focused on practical hosted agent app patterns.

## Build Loop

The successful loop was sequential, not parallel:

1. Pick one template idea.
2. Scaffold the app, API, database, workspace docs, and manifest.
3. Run build/typecheck/local checks.
4. Commit the template.
5. Move to the next template only after the prior one is clean.

This avoided the main failure mode from earlier brainstorming: many partial prototypes with unclear status.

The five-template batch worked because each project shared a baseline stack:

- Next.js App Router
- local SQLite through `better-sqlite3`
- `server.js` production entry
- `/app` base path
- no Tailwind
- no path aliases
- no Pinata scheduled tasks
- no required secrets in `manifest.json`

## First Pass

The first pass created working full-stack prototypes for each idea. These were useful but still too similar:

- most apps used a three-column admin layout
- browser UIs still had too much form/write energy
- visual design was functional but generic
- workspace identity and bootstrap docs needed more agent-facing specificity

Even so, the first pass proved the basic template pattern was repeatable.

## Second Pass

The second pass moved the examples toward a stronger Pinata agent pattern:

- browser dashboards became read-only
- write paths stayed available through API routes for chat/agent use
- `workspace/OPERATIONS.md` was added to each project
- `BOOTSTRAP.md`, `IDENTITY.md`, `AGENTS.md`, and `USER.md` were expanded
- optional Basic Auth was added with `APP_PASSWORD`
- each app got a clearer domain-specific dashboard

This pass clarified the core product pattern: the app is a status surface, while the OpenClaw chat is the operating interface.

## Manifest Normalization

The first manifests used an intermediate shape that looked plausible but did not match the working Pinata examples closely enough.

The manifests were normalized against `pinata-tamagotchi`, `pinata-chef`, Pinata docs, and the example-template repo pattern:

```json
{
  "$schema": "https://agents.pinata.cloud/schemas/manifest.v1.json",
  "version": 1,
  "agent": {
    "name": "...",
    "description": "...",
    "emoji": "...",
    "vibe": "..."
  },
  "template": {
    "slug": "...",
    "category": "productivity",
    "authorName": "Raid Guild",
    "tags": ["raidguild", "pinata", "agent", "nextjs", "sqlite"]
  },
  "secrets": [],
  "scripts": {
    "build": "npm install && npm run build",
    "start": "npm start"
  },
  "routes": [
    {
      "port": 3000,
      "path": "/app",
      "protected": false
    }
  ]
}
```

Important learning: keep manifests boring and close to known-good examples. Avoid adding plausible fields until the deploy validator proves they are supported.

## OpenClaw Proxy Pass

The lab then copied the useful proxy pattern from `pinata-chef` into all five examples.

Each template now has optional routes:

- `GET /app/api/openclaw/health`
- `POST /app/api/openclaw/responses` -> `POST /v1/responses`
- `POST /app/api/openclaw/hooks/:name` -> `POST /hooks/:name`

The proxy is disabled unless `API_PASSWORD` is set. This keeps the default template safe and simple, while allowing operators to expose controlled relay routes when needed.

The proxy assumes:

- `OPENCLAW_BASE_URL` defaults to `http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN` is used automatically if present
- Pinata-hosted environments may provide OpenClaw defaults in runtime env
- the operator still needs to enable responses/hooks in `openclaw.json`

We also had to bypass `APP_PASSWORD` middleware for `/api/openclaw/*` so that proxy routes can use `API_PASSWORD` as their own auth layer.

## Design Pass

The design pass came after the apps were functionally stable. This was important: trying to make everything beautiful during scaffolding would have slowed the core template validation.

The issue found during browser review was that the five apps were too visually similar. They had different data but shared:

- similar topbars
- metric pills
- left list / center detail / right side panel layouts
- boring font choices
- few visual data elements

A dedicated steering doc, `DESIGN_PASS_STEERING.md`, was created before implementation. That helped make each redesign more intentional.

Final design directions:

- Micro CRM: relationship radar with pipeline signal, follow-up strip, account matrix, and contact dossier.
- Practice Coach: training console with streak ring, goal lanes, practice heatmap, and session interval bars.
- Field Notes Research: editorial evidence desk with memo header, filter tape, source coverage bars, evidence cards, and open research threads.
- Memory Garden: living knowledge map with topic islands, link paths, resurfaced sprouts, cluster tray, and memory petals.
- Community Quest Board: guild mission board with XP meter, status banners, bounty zones, mission briefing, and ledger recap.

Each app now includes:

```text
built by the RaidGuild cohort
```

## Validation Pattern

For each significant project pass:

```bash
npm run build
npm run typecheck
```

Builds were run before typecheck in some cases because stale `.next/types` files can cause local `tsc --noEmit` failures after route changes. Running `next build` regenerates those types.

This is worth remembering for future loops: if typecheck complains about missing `.next/types/...`, run `npm run build` and then rerun typecheck.

## What Worked

- Sequential project work with one commit per completed pass.
- Keeping the runtime stack identical across templates.
- Treating `/app` as read-only and chat as the main write interface.
- Adding `workspace/OPERATIONS.md` so the agent has concrete API instructions.
- Normalizing manifests against known-good working examples.
- Deferring stronger visual design until the templates were already stable.
- Adding a steering document before the design pass.

## Friction Points

- Pinata deploy errors can be truncated, making root causes hard to inspect.
- The deploy process is partly opaque from the template developer's perspective.
- Plausible manifest fields can pass human review but fail validator/build assumptions.
- `.gitignore` behavior in Pinata-created instance repos can hide expected app files.
- Tailwind-style default setups can be risky if generated ignores or content paths are not explicit.
- OpenClaw response/webhook routes require both app proxy code and `openclaw.json` gateway config.
- It is not obvious which runtime environment variables Pinata injects by default, including whether there is a canonical public base URL for the hosted route. Developers may need to inspect the runtime environment manually from a terminal until this is documented or surfaced.
- Local Next typecheck can be confused by stale `.next/types` after route changes.

## Recommended Future Lab Flow

1. Start from a known-good template skeleton.
2. Keep manifest minimal and v1-compatible.
3. Scaffold one template at a time.
4. Commit after each template reaches build/typecheck.
5. Convert browser UI to read-only before adding polish.
6. Add `OPERATIONS.md` early so the chat agent has write instructions.
7. Add optional auth and proxy patterns after the app works.
8. Create a design steering doc before visual redesign.
9. Run real Pinata deploy tests on one or two examples before scaling changes across all templates.
10. Keep a lab report updated with errors, workarounds, and deploy behavior.

## Current Status

The five themed examples have completed:

- scaffold pass
- second pass
- manifest normalization
- optional OpenClaw proxy pass
- design pass

The RaidGuild Agent App Starter now captures the generic deployable pattern as a simpler template: read-only `/app`, SQLite CRUD, optional `APP_PASSWORD`, optional `API_PASSWORD` OpenClaw proxy routes, Pinata v1 manifest, and workspace handoff docs.

Each app builds and typechecks locally. The next useful step is real Pinata deployment testing on the starter and one themed example to confirm the manifest, route, auth, proxy, and `openclaw.json` assumptions in the hosted environment.
