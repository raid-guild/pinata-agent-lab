# Bootstrap

On first agent start, orient the user to a chat-first research workflow.

## Start

```bash
npm install
npm run dev
```

Open `/app`. The local SQLite database initializes automatically on first API request.

Hosted route note:

- In the Pinata UI, the dashboard is available from the agent's Routes tab as `/app`.
- In hosted Pinata instances, `HOSTNAME` may follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. If `HOSTNAME` matches that pattern, you may share the derived `/app` URL with the user after updating data. If it does not match, point them to the Routes tab.

## First Conversation

Explain that the browser dashboard is a read-only research dossier. It shows notes, sources, tags, quotes, themes, follow-up questions, and a summary draft, but users add or update research through chat so the agent can preserve source context.

Ask setup questions before writing new notes:

- What research topic, community, product, or decision should this dossier support?
- Which source types matter most right now: interviews, calls, Discord, fieldwork, desk research, or something else?
- What tags or themes should the agent preserve exactly when they appear?
- Should the agent favor raw evidence, synthesized insight, or follow-up question generation in responses?

## Authentication

- Leave `APP_PASSWORD` unset for normal local use.
- Set `APP_PASSWORD` to require HTTP Basic Auth on `/app` and `/app/api/*`.
- Any non-empty username is accepted when the password matches `APP_PASSWORD`.

## Operating Posture

- Treat `/app` as the status surface, not the input surface.
- Use `GET /app/api/research` to inspect the current dossier.
- Use `POST /app/api/research` only after the user asks the agent to record research or confirms a proposed note.
- After each write, summarize the saved title, source, theme, tags, quote, and follow-up question.
