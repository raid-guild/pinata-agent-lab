# Pinata Agent Lab

RaidGuild cohort lab for Pinata agent template experiments.

This repo collects deployable Pinata agent app templates that share a few patterns:

- chat-first operation
- read-only `/app` dashboards
- SQLite-backed local app memory
- optional `APP_PASSWORD` app auth
- optional `API_PASSWORD` OpenClaw response/webhook proxy routes
- workspace docs for bootstrap, identity, operations, tools, and live-instance setup

Each template is self-contained in its own subfolder. In the Pinata template UI, use this repo URL and set the matching subfolder.

## Templates

| Template | Subfolder | Focus |
| --- | --- | --- |
| RaidGuild Agent App Starter | `raidguild-agent-app-starter` | Generic Next.js + SQLite starter pattern |
| Micro CRM | `micro-crm` | Solo operator relationship and follow-up dashboard |
| Practice Coach | `practice-coach` | Skill practice goals, streaks, sessions, and next plans |
| Field Notes Research | `field-notes-research` | Research notes, sources, themes, quotes, and summaries |
| Memory Garden | `memory-garden` | Personal memory clusters, resurfacing, and linked notes |
| Community Quest Board | `community-quest-board` | Cohort or guild quest tracking and weekly coordination |

## Publishing From Subfolders

In the Pinata template creation form:

1. Paste this repository URL.
2. Set the desired subfolder, for example `micro-crm`.
3. Validate the template.
4. Deploy a fresh instance and test chat, `/app`, API routes, and optional auth/proxy behavior.

CLI validation should use the same repo and subfolder once Pinata exposes equivalent CLI support for subfolder templates. Until then, the UI subfolder field is the source of truth for this repo layout.

## Local Checks

Each template has its own `package.json`.

```bash
cd micro-crm
npm install
npm run build
npm run typecheck
```

Repeat in the subfolder you are changing.

## Lab Notes

The root markdown files document the cohort build process and follow-up observations:

- `PROJECTS.md` lists the template ideas.
- `BATCH_REPORT.md`, `SECOND_PASS_REPORT.md`, and `LAB_FLOW_NOTES.md` summarize build passes.
- `DESIGN_PASS_STEERING.md` and `NEXT_PASS_STEERING.md` capture iteration guidance.
- `SCAFFOLD_RULES.md` and `RUNNER_PROMPT.md` preserve the original automation process.

The standalone starter is also published separately at:

`https://github.com/raid-guild/raidguild-agent-app-starter`
