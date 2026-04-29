# Pinata Template Lab Batch Report

Date: 2026-04-29

## Summary

All five selected template scaffolds completed in the sequential WIGUM loop. Each project has a working Next.js App Router app at `/app`, SQLite persistence through `better-sqlite3`, local API routes, workspace handoff docs, a `BUILD_STATUS.md`, and a committed checkpoint.

Queue state: complete

Blocked projects: none

## Project Status

### Micro CRM for Solo Operators

Folder: `micro-crm`

Status: complete

Commit: `6ee99bc Complete micro CRM template`

Current slice:
- Contacts, notes, next actions, lightweight pipeline status, today's follow-ups, and stored follow-up drafts.
- Validation passed for install, typecheck, build, local `/app`, and local health API.

Polish next:
- Add create/edit contact flows instead of relying on seed data.
- Add import/export for CSV or JSON handoff.
- Normalize the manifest against the latest Pinata template schema before publishing.
- Add a short agent chat playbook for drafting follow-ups from stored context.

### Personal Practice Coach

Folder: `practice-coach`

Status: complete

Commit: `1cce119 Complete practice coach template`

Current slice:
- Practice goals, sessions, streaks, reflections, due practice, and next-session plans.
- Validation passed for install, typecheck, build, local `/app`, health API, and practice API.

Polish next:
- Add goal creation/editing and archive behavior.
- Add calendar or weekly rhythm view for streak clarity.
- Add lightweight coaching prompts in workspace docs for OpenClaw chat.
- Normalize the manifest against the latest Pinata template schema before publishing.

### Field Notes Research Agent

Folder: `field-notes-research`

Status: complete

Commit: `867636e Build field notes research template`

Current slice:
- Field notes, sources, tags, quotes, themes, follow-up questions, and a summary draft.
- Validation passed for install, typecheck, build, `/app`, health routes, and research API.

Polish next:
- Add edit/delete flows for notes.
- Add exportable markdown report generation.
- Add richer filters by source type, date, and theme.
- Convert the summary draft into an agent-assisted synthesis flow.

### Memory Garden

Folder: `memory-garden`

Status: complete

Commit: `ec901da Complete memory garden template`

Current slice:
- Topics, memories, idea links, growth/recency visualization, resurfaced notes, and health routes.
- Validation passed for install, typecheck, build, local `/app`, and health checks.

Polish next:
- Add topic creation/editing.
- Improve the garden visualization beyond simple clustered circles.
- Add backlink and related-memory suggestions.
- Add a review mode that turns resurfaced memories into a daily ritual without Pinata scheduled tasks.

### Community Quest Board

Folder: `community-quest-board`

Status: complete

Commit: `5ef12ff Build community quest board template`

Current slice:
- Quest board columns, claim/owner status, updates, outcomes, and weekly recap.
- Validation passed for install, typecheck, build, local `/app`, and health API.

Polish next:
- Add create/edit quest flows.
- Add assignee filters and due-date warnings.
- Add recap export to markdown for Discord/Telegram posts.
- Add an agent steward workflow that can summarize updates and propose next asks.

## Cross-Template Observations

- All templates follow the no-Tailwind, no-path-alias, local SQLite, `/app` route pattern that has been the most reliable in Pinata template deploy tests.
- Each install reported two moderate dependency audit findings from the shared dependency set. No `npm audit fix --force` was applied because this was a scaffold pass and forced upgrades may introduce breaking changes.
- The generated manifests are useful metadata, but they should be reviewed against the current official Pinata manifest schema before any of these are published as production templates.
- Several validation runs had to account for ports already in use. Future automation should allocate ports explicitly per project.
- The Next.js generated type files can race if `npm run typecheck` and `npm run build` are started concurrently. Future runner prompts should require sequential validation.

## Recommended Next Pass

1. Normalize `manifest.json` across all five templates to the current Pinata schema.
2. Add one create/edit path per template so each app can move beyond seeded data.
3. Add one OpenClaw-facing handoff file per template that defines the agent role, safe actions, and useful chat prompts.
4. Run a real Pinata template validation/deploy pass on one template first, then apply deploy fixes across the set.
5. Package the strongest one or two as showcase candidates, rather than polishing all five equally.
