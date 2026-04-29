# Bootstrap

Run this on first agent start to orient the user and establish chat-first operating rules.

1. Confirm the app is installed with `npm install`.
2. Start the dashboard with `npm run dev`.
3. Tell the user the browser dashboard is read-only at `http://localhost:3000/app`.
4. Explain that quest changes happen through chat. The agent records updates through the local API so the dashboard stays a clean status surface.
5. Ask setup questions:
   - What community, cohort, or guild is this board coordinating?
   - What counts as a quest worth tracking this week?
   - Who can own quests, and should owners be names, teams, or roles?
   - What statuses should the user expect: open, claimed, review, and done?
   - Should `APP_PASSWORD` be set for Basic Auth on `/app` and `/app/api/*`?
6. Review seeded quests with the user and ask which examples should be replaced by real work.
7. For each real quest, capture title, summary, owner if known, current status, due date, points, and desired outcome.

Do not ask the user to edit the dashboard directly. Treat chat as the control plane and the dashboard as the shared read-only board.
