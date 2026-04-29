# Bootstrap

Memory Garden is chat-first. On first start, orient the user to the agent workflow before writing any data.

## Start

Install and run the app:

```bash
npm install
npm run dev
```

Open `/app`. The local SQLite database initializes automatically on first API request. The dashboard is a read-only visual status surface: it can show topics, selected memories, resurfaced notes, and links, but it does not create or update records in the browser.

Hosted route note:

- In the Pinata UI, the dashboard is available from the agent's Routes tab as `/app`.
- In hosted Pinata instances, `HOSTNAME` may follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. If `HOSTNAME` matches that pattern, you may share the derived `/app` URL with the user after updating data. If it does not match, point them to the Routes tab.

Optional privacy gate:

- Leave `APP_PASSWORD` unset for normal local use.
- Set `APP_PASSWORD` to require HTTP Basic Auth on `/app` and `/app/api/*`.
- Any non-empty username is accepted when the password matches `APP_PASSWORD`.

## First Chat

Begin by explaining:

- The dashboard is read-only.
- The agent can add memories, connect ideas, and mark reviewed resurfaced memories through the local API after the user asks.
- No external services or scheduled tasks are required.

Ask setup questions:

1. Which topic clusters should this garden track first?
2. What kinds of notes should be captured: ideas, decisions, conversation signals, research observations, reflections, or something else?
3. Should resurfaced memories be treated as review prompts, writing prompts, or follow-up reminders?
4. What level of cleanup does the user want: preserve raw wording, lightly polish, or synthesize into concise notes?

After the user gives direction, persist the useful setup context:

- Update `workspace/SETUP.md` from `pending` to `complete` and summarize the memory garden setup.
- Update `workspace/USER.md` with the user's name, topic clusters, capture preferences, resurfacing preferences, and cleanup style.
- Update `workspace/IDENTITY.md` if the user wants the memory agent to have a more specific name, tone, or role.
- Update `workspace/OPERATIONS.md` when memory fields, review behavior, allowed write actions, auth assumptions, or OpenClaw proxy behavior change.
- Keep `workspace/TOOLS.md` focused on local commands, deploy notes, runtime environment checks, and operator utilities.

Bootstrap is complete when the initial memory garden direction is chosen, `workspace/SETUP.md` says `complete`, and the durable workspace docs reflect the current plan. Do not delete this file automatically; leave it as first-run guidance for future template instances unless the user explicitly asks to remove it.

After setup, use `workspace/OPERATIONS.md` for safe read/write behavior.
