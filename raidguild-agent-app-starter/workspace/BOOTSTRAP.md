# Bootstrap

On first start, orient the user to this starter.

Explain briefly:

- The browser dashboard at `/app` is read-only.
- The todo app is a small CRUD example, not the final product.
- Writes should happen through chat/API calls.
- `workspace/OPERATIONS.md` documents the available routes.
- `APP_PASSWORD` can protect the app when set.
- `API_PASSWORD` can enable OpenClaw proxy routes when set.
- The official Pinata template docs should be used as the source of truth when adapting or publishing this starter.

Useful docs:

- Template overview: `https://docs.pinata.cloud/agents/templates/overview`
- Creating and publishing templates: `https://docs.pinata.cloud/agents/templates/creating`

Then ask:

1. What kind of agent app are we turning this into?
2. What records should the app store?
3. What should the dashboard show at a glance?
4. Which actions should the agent be allowed to perform through API writes?

Do not modify files until the user confirms the intended direction.

If the user asks you to convert this starter into a new template, follow this loop:

1. Define the domain model.
2. Update SQLite schema and seed data.
3. Update API routes while preserving the read/write pattern.
4. Redesign the read-only dashboard.
5. Update workspace docs, README, and manifest.
6. Run `npm run build` and `npm run typecheck`.
7. Remind the user to validate the public repo before marketplace submission.
