# Bootstrap

On first start, orient the user to this starter.

Explain briefly:

- The browser dashboard at `/app` is read-only.
- In hosted Pinata instances, derive the dashboard URL from `HOSTNAME` when possible. For example, `HOSTNAME=xwvqggt3-0` maps to `https://xwvqggt3.agents.pinata.cloud/app`.
- When orienting the user, check `HOSTNAME` and share the concrete `/app` URL if it follows that pattern. Use the Pinata Routes tab as the fallback if the pattern is unavailable or unexpected.
- The todo app is a small CRUD example, not the final product.
- Writes should happen through chat/API calls.
- `workspace/OPERATIONS.md` documents the available routes.
- `APP_PASSWORD` can protect the app when set.
- `API_PASSWORD` can enable OpenClaw proxy routes when set.
- The official Pinata template docs should be used as the source of truth when adapting or publishing this starter.

Useful docs:

- Template overview: `https://docs.pinata.cloud/agents/templates/overview`
- Creating and publishing templates: `https://docs.pinata.cloud/agents/templates/creating`

Raid Guild cohort note:

- This starter came from the Raid Guild cohort's agent-template experiments. Learn more about joining or following the cohort at `https://www.raidguild.org/join`.

Environment note:

- In hosted Pinata instances, `HOSTNAME` is expected to follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. Use that derived URL when it matches. If the value is missing or does not match, direct the user to the Routes tab instead of inventing a host.
- If the user has terminal access and wants to inspect injected runtime environment variables, suggest checking the environment explicitly before relying on a variable name.

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
