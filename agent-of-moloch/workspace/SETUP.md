# Setup

Status: complete

Project summary:

Agent of Moloch is a Pinata template for a characterful Moloch/Baal governance agent. It stores DAOs, charters, theses, governance mandates, proposal records, vote recommendations, rationales, service sync checkpoints, and suggested governance tasks. The dashboard at `/app` is read-only; writes happen through API routes or chat.

Immediate next steps for a fresh instance:

- Add real Base Baal DAO addresses. Demo rows are created only when `SEED_DEMO_DATA=true`.
- Record each DAO's charter, thesis, and the agent's governance mandate.
- Run the bootstrap flow in `workspace/skills/moloch-agent-simple/SKILL.md`.
- Create or locate shared memory and record `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI` when available.
- Use `/app/api/sync/dao` and `/app/api/sync/memory` to cache real DAOhaus/DAO database records for the dashboard.
- Use `moloch-agent health` and `moloch-agent capabilities` to confirm the service is reachable.
- Add active proposals from DAOhaus or the Moloch skills.
- Enable the manifest task examples only after signer, mandate, RPC/Graph access, shared-memory location, and autonomy boundaries are configured.
- Use the mandate and vote-reasoning guidance in `workspace/skills/moloch-agent-simple/SKILL.md` before vote recommendations.
- Use `moloch-agent proposal-lifecycle`, `read-proposal`, and `process-queue` before any vote or proposal action.
- Broadcast only when mandate, task, or harness policy permits it and live preflight passes. Otherwise build unsigned transactions for review.
