# Operations

Practice Coach is operated through chat/API writes with a read-only browser dashboard at `/app`.

## Read Routes

`GET /app/api/health`

Returns service health after opening the SQLite database.

`GET /app/api/practice`

Returns all goals, the selected goal, recent sessions for that goal, stored plans, and due goals.

Optional query:

```json
{
  "goalId": 1
}
```

Use as `/app/api/practice?goalId=1`.

## Write Routes

`POST /app/api/practice`

Logs a practice session and updates the goal's next drill, next session date, current streak, and best streak.

Expected JSON:

```json
{
  "goalId": 1,
  "minutes": 35,
  "drill": "G-C-D transition ladder at 92 BPM",
  "reflection": "Timing stayed clean for the first two rounds. Tension returned above 94 BPM.",
  "nextDrill": "Repeat the ladder at 90 BPM, then record one pass at 94 BPM.",
  "nextSessionDate": "2026-04-30"
}
```

Rules:

- `goalId` is required.
- `drill` and `reflection` must be non-empty.
- `minutes` is rounded and clamped to at least 1.
- `nextSessionDate` should be an ISO date string: `YYYY-MM-DD`.

`POST /app/api/plans`

Stores a next-session plan for a goal.

Expected JSON:

```json
{
  "goalId": 1,
  "body": "Warm up for 5 minutes, work the transition ladder for 20 minutes, then record one final take."
}
```

Rules:

- `goalId` is required.
- `body` must be non-empty.
- The plan title is generated from the goal discipline.

## Safe Agent Rules

- Write only when the user clearly asks to log a session or save a plan.
- Summarize the planned write before calling a write route when the user's intent is ambiguous.
- Keep reflections in the user's words when possible.
- Do not invent completed practice. If details are missing, ask for minutes, drill, and reflection.
- Use the dashboard only as a status surface. Do not ask the user to edit records in the browser.
- If `APP_PASSWORD` is set, include valid Basic Auth credentials for both read and write API calls.
