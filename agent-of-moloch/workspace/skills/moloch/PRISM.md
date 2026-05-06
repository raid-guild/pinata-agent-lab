# Prism Integration

This repo contains Codex skills plus runtime assets for DAOhaus/Moloch V3/Baal DAO operations.

## Prism Install Pattern

For Prism instances, do not install these skills only into `CODEX_HOME` or `/data/codex/skills`.

Use the Prism-managed skill flow:

1. Store runtime assets under:

   `/data/custom/moloch-skills`

2. Store each managed skill definition through the site service:

   `POST /api/internal/skills`

3. The managed skill definitions should be written under:

   `/data/skills/<skill-name>/SKILL.md`

4. Each `SKILL.md` should reference runtime scripts by absolute path, for example:

   `/data/custom/moloch-skills/moloch-shared/scripts/moloch.mjs`

## Runtime Assets

The shared CLI lives in:

```bash
/data/custom/moloch-skills/moloch-shared/scripts/moloch.mjs
```

Install dependencies from:

```bash
cd /data/custom/moloch-skills/moloch-shared
npm install
node scripts/moloch.mjs --help
```

## Environment

Read-only operations:

```bash
RPC_URL=https://mainnet.base.org
GRAPH_API_KEY=...
# or
GRAPH_URL=...
```

Broadcasting transactions:

```bash
PRIVATE_KEY=0x...
```

`PRIVATE_KEY` is only required for `--send` operations. Never request or use it for read-only commands.

## Safety Rules

- Read-only skills may run without extra confirmation.
- Transaction-building skills may build unsigned transaction JSON.
- Broadcasting requires explicit user confirmation in the same conversation.
- Never broadcast with `--send` unless the user explicitly asks to send the transaction.
- Before broadcasting, re-read current DAO/proposal state from chain.
- Graph data can lag; use direct contract reads for permissions, timing, and threshold checks.
- Record transaction hashes and re-read state after confirmation.

## Recommended Prism Skill Split

Register read-only skills first:

- `moloch-shared`
- `moloch-dao-read`
- `moloch-proposals`

Register action skills with stricter instructions:

- `moloch-proposal-actions`
- `moloch-summon`
- `meta-clawtel-launch`

## Prism Skill Author Prompt

Use this prompt inside a Prism instance:

```text
Install HausDAO moloch skills as Prism-managed custom skills.

Source repo:
https://github.com/HausDAO/moloch-skills

Use:
- runtime assets: /data/custom/moloch-skills
- managed skill definitions: POST /api/internal/skills
- do not install final skills only into /data/codex/skills

Create managed SKILL.md definitions for:
- moloch-shared
- moloch-dao-read
- moloch-proposals
- moloch-proposal-actions
- moloch-summon
- meta-clawtel-launch

Each SKILL.md must reference the shared CLI by absolute path:
/data/custom/moloch-skills/moloch-shared/scripts/moloch.mjs

Install Node dependencies in:
/data/custom/moloch-skills/moloch-shared

Verify:
- Skills appear in Prism Skills UI.
- A read-only command works.
- Transaction skills require explicit confirmation before broadcasting.
```

## Future Machine-Readable Pack

If Prism needs stricter automation later, add a small `prism.skill-pack.json`. Start with this `PRISM.md` because agents will read it naturally when they encounter the repo.

