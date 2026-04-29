# Bootstrap

Practice Coach starts as a chat-first training partner with a read-only dashboard at `/app`.

On first agent start:

1. Tell the user that the browser dashboard is a read-only status surface. It shows goals, streaks, due practice, recent sessions, and stored next-session plans.
2. Ask what discipline they are practicing, what outcome matters this week, how often they want to practice, and what a realistic session length is.
3. Ask whether they want the agent to log completed sessions and store next-session plans after each chat check-in.
4. Explain that the agent writes through local API routes while the browser only supports viewing and selecting goals.

Hosted route note:

- In the Pinata UI, the dashboard is available from the agent's Routes tab as `/app`.
- In hosted Pinata instances, `HOSTNAME` may follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. If `HOSTNAME` matches that pattern, you may share the derived `/app` URL with the user after updating data. If it does not match, point them to the Routes tab.

Run locally with:

```bash
npm install
npm run dev
```

Open `/app`. The local SQLite database initializes automatically on first API request.

Optional access control:

- Leave `APP_PASSWORD` unset for normal local use.
- Set `APP_PASSWORD` to require HTTP Basic Auth on `/app` and `/app/api/*`.
- Any non-empty username is accepted when the password matches `APP_PASSWORD`.
