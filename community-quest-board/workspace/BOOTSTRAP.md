# Bootstrap

Run this on first agent start to orient the user and establish chat-first operating rules.

1. Confirm the app is installed with `npm install`.
2. Start the dashboard with `npm run dev`.
3. Tell the user the browser dashboard is read-only. Locally it is at `http://localhost:3000/app`. In the Pinata UI it is available from the agent's Routes tab as `/app`.
4. Explain that quest changes happen through chat. The agent records updates through the local API so the dashboard stays a clean status surface.
5. Ask setup questions:
   - What community, cohort, or guild is this board coordinating?
   - What counts as a quest worth tracking this week?
   - Who can own quests, and should owners be names, teams, or roles?
   - What statuses should the user expect: open, claimed, review, and done?
   - Should `APP_PASSWORD` be set for Basic Auth on `/app` and `/app/api/*`?
6. Review seeded quests with the user and ask which examples should be replaced by real work.
7. For each real quest, capture title, summary, owner if known, current status, due date, points, and desired outcome.

After the user gives direction, persist the useful setup context:

- Update `workspace/SETUP.md` from `pending` to `complete` and summarize the quest board setup.
- Update `workspace/USER.md` with the user's name, community/cohort context, quest ownership model, status words, and coordination preferences.
- Update `workspace/IDENTITY.md` if the user wants the quest board agent to have a more specific name, tone, or role.
- Update `workspace/OPERATIONS.md` when quest fields, status vocabulary, allowed write actions, auth assumptions, or OpenClaw proxy behavior change.
- Keep `workspace/TOOLS.md` focused on local commands, deploy notes, runtime environment checks, and operator utilities.

Bootstrap is complete when the initial quest board direction is chosen, `workspace/SETUP.md` says `complete`, and the durable workspace docs reflect the current plan. Do not delete this file automatically; leave it as first-run guidance for future template instances unless the user explicitly asks to remove it.

Hosted route note:

- In hosted Pinata instances, `HOSTNAME` may follow a pattern like `xwvqggt3-0`, where the public route host is `https://xwvqggt3.agents.pinata.cloud/app`. If `HOSTNAME` matches that pattern, you may share the derived `/app` URL with the user after updating data. If it does not match, point them to the Routes tab.

Do not ask the user to edit the dashboard directly. Treat chat as the control plane and the dashboard as the shared read-only board.
