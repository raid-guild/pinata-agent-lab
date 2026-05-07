# Setup

Status: complete

Project summary:

Agent of Moloch is a Pinata template for a characterful Moloch/Baal governance agent. It stores DAOs, charters, theses, governance mandates, proposal records, vote recommendations, rationales, snapshot checkpoints, and suggested governance tasks. The dashboard at `/app` is read-only; writes happen through API routes or chat.

Immediate next steps for a fresh instance:

- Replace seed DAO addresses with real Base Baal DAO addresses.
- Record each DAO's charter, thesis, and the agent's governance mandate.
- Run `task-snapshot` for each real DAO and store checkpoint paths through `/app/api/artifacts`.
- Add active proposals from DAOhaus or the Moloch skills.
- Use `workspace/skills/moloch/moloch-agent-conviction` and `workspace/skills/moloch/VOTE_DECISION_FLOW.md` before vote recommendations.
- Use `workspace/skills/moloch/moloch-dao-read` before any vote or proposal action.
- Broadcast only when mandate, task, or harness policy permits it and live preflight passes. Otherwise build unsigned transactions for review.
