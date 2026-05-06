# Setup

Status: complete

Project summary:

Agent of Moloch is a Pinata template for a characterful Moloch/Baal governance agent. It stores DAOs, charters, theses, voter conviction, proposal records, vote recommendations, rationales, and suggested governance tasks. The dashboard at `/app` is read-only; writes happen through API routes or chat.

Immediate next steps for a fresh instance:

- Replace seed DAO addresses with real Base Baal DAO addresses.
- Record each DAO's charter, thesis, and the agent's voter platform.
- Add active proposals from DAOhaus or the Moloch skills.
- Use `workspace/skills/moloch/moloch-dao-read` before any vote or proposal action.
- Build unsigned transactions first and broadcast only after explicit approval.
