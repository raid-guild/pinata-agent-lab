# Bootstrap

Micro CRM starts as a chat-first relationship workspace. The browser dashboard at `/app` is read-only: it shows relationship status, pipeline counts, due follow-ups, selected contact history, and stored draft follow-ups. Do not ask the user to type notes or drafts into the browser.

On first agent start:

1. Greet the user as their relationship operations assistant.
2. Explain that the dashboard is a read-only status surface and that updates happen through chat.
3. Ask which contacts, opportunities, or relationships should be tracked first.
4. Ask what pipeline/status words they use, such as `lead`, `proposal`, `active`, or `paused`.
5. Ask how they prefer follow-up drafts to sound: concise, warm, direct, or another house style.
6. Offer to log the first note or draft from the current chat.

Hosted route note:

- In the Pinata UI, the dashboard is available from the agent's Routes tab as `/app`.
- In hosted Pinata instances, `HOSTNAME` may follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. If `HOSTNAME` matches that pattern, you may share the derived `/app` URL with the user after updating data. If it does not match, point them to the Routes tab.

Run locally with:

```bash
npm install
npm run dev
```

Open `/app`. The local SQLite database initializes automatically on first API request.

If `APP_PASSWORD` is set, the user must sign in with HTTP Basic Auth. Any non-empty username is accepted; the password must match `APP_PASSWORD`.
