# Operations

The browser dashboard at `/app` is read-only. It may select topics and inspect memories, resurfaced notes, and links, but it must not create records or mark records seen. Agents may write only after a chat instruction or an explicit setup decision from the user.

## Read Routes

### `GET /app/api/health`

Returns service health and initializes SQLite if needed.

Response:

```json
{ "ok": true, "service": "memory-garden" }
```

### `GET /app/api/memories`

Returns the full garden bundle: topics, selected topic, selected-topic memories, all memories, links, and resurfaced memories.

Optional query parameters:

- `topicId`: numeric topic id to select a cluster.

Example:

```bash
curl "http://127.0.0.1:3000/app/api/memories?topicId=1"
```

## Write Routes

### `POST /app/api/memories`

Adds a memory to an existing topic. This route is preserved for chat and agent use; the browser UI must not call it.

Payload:

```json
{
  "title": "Friction is data",
  "body": "When a workflow feels slow, the resistance usually points at an unclear handoff or an overloaded decision.",
  "topicId": 1,
  "growth": 3
}
```

Rules:

- `title`, `body`, and `topicId` are required.
- `growth` is optional and is clamped from `1` to `5`.
- Ask the user which topic to use when the topic is ambiguous.
- Preserve the user's language unless they ask for cleanup.

### `POST /app/api/memories`

Marks a resurfaced memory as seen and increments its growth score.

Payload:

```json
{
  "seenMemoryId": 4,
  "topicId": 1
}
```

Rules:

- Use this only after the user confirms they reviewed or handled the resurfaced memory.
- Include `topicId` when the dashboard should remain on the same selected cluster after the write.

### `POST /app/api/links`

Creates an explicit connection between two stored memories.

Payload:

```json
{
  "sourceId": 1,
  "targetId": 4,
  "note": "Both turn vague discomfort into navigable structure.",
  "topicId": 1
}
```

Rules:

- `sourceId` and `targetId` are required and must be different memories.
- `note` should explain the useful connection in one short sentence.
- `topicId` is optional and only affects the returned selected bundle.

## Authentication

If `APP_PASSWORD` is unset, the app and API are open locally. If `APP_PASSWORD` is set, `/app` and `/app/api/*` require HTTP Basic Auth. Use any non-empty username and the configured password.

Example:

```bash
curl -u operator:$APP_PASSWORD http://127.0.0.1:3000/app/api/memories
```

## Safe Agent Rules

- Treat chat as the primary write interface and the dashboard as a read-only status surface.
- Confirm ambiguous topic placement before adding a memory.
- Never invent memories, review status, or links.
- Prefer small durable notes over broad summaries unless the user asks for synthesis.
- Link memories only when the relationship is concrete enough to help retrieval.
- Never delete data through ad hoc database changes.
- Never bypass the API for routine operations.
- After a write, summarize what changed and invite the user to review the read-only garden.
