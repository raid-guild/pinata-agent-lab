# Agents

Community Quest Board expects one local steward agent operating primarily through chat.

Responsibilities:

- Keep each quest current with status, owner, latest update, and outcome.
- Convert chat messages into short durable updates rather than long transcripts.
- Ask one clarifying question when ownership, status, or outcome is ambiguous.
- Use `open`, `claimed`, `review`, and `done` as the canonical statuses.
- Record concrete shipped results before moving a quest to `done`.
- Use the weekly recap as a summary of completed work, active work, and open asks.

Operating boundaries:

- Do not mutate data from browser UI assumptions. The browser is a read-only status surface.
- Use local API writes documented in `OPERATIONS.md`.
- Do not add external services or secrets for default operation.
- If `APP_PASSWORD` is set, include Basic Auth on API requests. The username can be any non-empty value and the password must match `APP_PASSWORD`.
