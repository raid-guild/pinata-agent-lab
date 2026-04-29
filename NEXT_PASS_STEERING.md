# Second Pass Steering

Goal: turn the five first-pass templates into read-only web dashboards that are operated primarily through OpenClaw chat/API calls.

## Global Requirements

- Browser UI is read-only. It may allow selection, filtering, and navigation, but it must not POST, mutate records, or show editable forms.
- Keep the existing API write routes for the agent. The agent uses those routes to update SQLite after chat interactions.
- Add `workspace/OPERATIONS.md` in every project. It should describe available API reads/writes, expected JSON payloads, and safe agent operating rules.
- Expand `workspace/BOOTSTRAP.md`. Bootstrap runs on first agent start and should orient the user, ask setup questions, and explain that the dashboard is a read-only status surface.
- Expand `workspace/IDENTITY.md`, `workspace/AGENTS.md`, and `workspace/USER.md` so the chat personality and job-to-be-done are clear.
- Add optional Basic Auth. If `APP_PASSWORD` is unset, the app works normally. If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Username may be any non-empty value; password must match `APP_PASSWORD`.
- Normalize `manifest.json` to the Pinata-style schema used by `pinata-tamagotchi`: `$schema`, `version`, `agent`, `template`, `secrets`, `scripts`, `routes`.
- Keep no Tailwind, no path aliases, no scheduled Pinata tasks, and no external secrets required for default operation.
- Preserve the route path `/app`.
- Run validation sequentially: `npm run build` then `npm run typecheck`, plus local health/app checks when practical.

## Design Inspiration

Use getdesign.md as inspiration only; do not add a dependency.

- `micro-crm`: Linear-inspired, precise operational dashboard, restrained neutral surfaces, tiny status tags.
- `practice-coach`: Apple/Nike-inspired training portfolio, strong progress metrics, spacious movement-oriented layout.
- `field-notes-research`: Notion/WIRED-inspired research dossier, document density, source filters, evidence-first cards.
- `memory-garden`: Miro/Figma-inspired visual knowledge map, playful clusters, colorful but still usable.
- `community-quest-board`: Airtable/Linear-inspired coordination board, compact columns, recap/status panels.

## Per-Template Second-Pass Target

### Micro CRM

- Read-only relationship portfolio.
- Show pipeline counts, due follow-ups, selected contact timeline, and stored draft follow-ups.
- Remove note/draft forms from the UI.
- `OPERATIONS.md` should tell the agent how to add notes and drafts through `/app/api/contacts` and `/app/api/suggestions`.

### Practice Coach

- Read-only training status dashboard.
- Show goals, streaks, due practice, recent sessions, and stored next-session plans.
- Remove session/plan forms from the UI.
- `OPERATIONS.md` should tell the agent how to log practice through `/app/api/practice` and store plans through `/app/api/plans`.

### Field Notes Research

- Read-only research dossier.
- Keep source/tag filters; remove note capture form.
- Show themes, notes, quotes, questions, and summary draft.
- `OPERATIONS.md` should tell the agent how to add notes through `/app/api/research`.

### Memory Garden

- Read-only memory portfolio.
- Keep topic selection; remove memory/link creation and seen buttons.
- Show topic garden, selected memories, resurfaced notes, and links.
- `OPERATIONS.md` should tell the agent how to add memories, add links, and mark resurfaced memories seen through `/app/api/memories` and `/app/api/links`.

### Community Quest Board

- Read-only coordination dashboard.
- Keep quest selection; remove update form.
- Show board columns, selected quest detail, updates, outcomes, and weekly recap.
- `OPERATIONS.md` should tell the agent how to update quests through `/app/api/updates`.

## Commit Discipline

Work one project at a time. Commit each complete project pass separately. Do not start a new project while the prior project has uncommitted changes.
