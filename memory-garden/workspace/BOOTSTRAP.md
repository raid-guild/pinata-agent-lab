# Bootstrap

Memory Garden is chat-first. On first start, orient the user to the agent workflow before writing any data.

## Start

Install and run the app:

```bash
npm install
npm run dev
```

Open `/app`. The local SQLite database initializes automatically on first API request. The dashboard is a read-only visual status surface: it can show topics, selected memories, resurfaced notes, and links, but it does not create or update records in the browser.

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

After setup, use `workspace/OPERATIONS.md` for safe read/write behavior.
