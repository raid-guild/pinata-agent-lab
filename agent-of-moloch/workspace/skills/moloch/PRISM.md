# Prism Integration

This repo contains Codex skills plus runtime assets for DAOhaus/Moloch V3/Baal DAO operations.

For scheduled agent task patterns, use `AGENT_TASKS.md`.
Prefer `task-snapshot` cron jobs for routine state gathering so agents can consume compact artifacts instead of repeating verbose Graph/RPC reads.
For vote reasoning, use `VOTE_DECISION_FLOW.md`.
For shared DAO memory and proposal workspaces, use `SHARED_MEMORY.md`.

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

Use `https://mainnet.base.org` only as a fallback for small tests. Dedicated RPC providers such as Alchemy or Infura are recommended for scheduled agents.

Base DAOhaus Graph endpoint:

```bash
GRAPH_URL=https://gateway.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW
```

Broadcasting transactions:

```bash
PRIVATE_KEY=0x...
```

`PRIVATE_KEY` is only required for `--send` operations. Never request or use it for read-only commands.

If 1Password CLI is available, Prism may use:

```bash
--vault-provider 1password --vault-item "<item>" --vault-field private_key
```

Use a dedicated RPC provider such as Alchemy or Infura for agent runs. Public Base RPC is acceptable for small tests but can rate limit chatty agents.

## Autonomous Execution Rules

- Read-only skills may run freely.
- Prism action skills should broadcast by default when live preflight passes and the managed signer has the required gas and DAO permissions.
- Transaction-building skills should use unsigned transaction JSON only for explicit dry-run, review, or draft tasks.
- Do not ask for operator approval before sending routine DAO actions.
- Do not broadcast with `--send` when chain preflight fails, required proposal data is missing or mismatched, signer/gas is unavailable, or the task explicitly asks for build-only mode.
- Before broadcasting, re-read current DAO/proposal state from chain.
- Graph data can lag; use direct contract reads for permissions, timing, and threshold checks.
- Record transaction hashes and re-read state after confirmation.
- Keep operator output abstract by default. Do not paste ABI fragments, large calldata, or full Graph JSON unless requested.
- Use `proposal-lifecycle` and `process-queue` instead of raw Graph fields when deciding whether to vote or process.
- Prism should treat managed DAO agents as autonomous actors and require post-action rereads.

## Recommended Prism Skill Split

Register read-only skills first:

- `moloch-shared`
- `moloch-dao-read`
- `moloch-proposals`
- `moloch-agent-conviction`

Register action skills with autonomous execution instructions:

- `moloch-proposal-actions`
- `moloch-summon`
- `meta-clawtel-launch`

## Prism Skill Author Prompt

Use this prompt inside a Prism instance:

```text
Install HausDAO moloch skills as Prism-managed custom skills.

Source repo:
https://github.com/HausDAO/moloch-skills

DAOhaus Admin frontend implementation:
https://github.com/HausDAO/daohaus-admin

Hosted admin instance:
https://admin.daohaus.club/

Use:
- runtime assets: /data/custom/moloch-skills
- managed skill definitions: POST /api/internal/skills
- do not install final skills only into /data/codex/skills

Create managed SKILL.md definitions for:
- moloch-shared
- moloch-dao-read
- moloch-proposals
- moloch-agent-conviction
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
- task-snapshot writes artifacts.
- Shared memory instructions are available and agents know to use `communityMemoryURI`.
- Transaction skills broadcast actions by default after live preflight and do not wait for operator approval.
```

## Future Machine-Readable Pack

If Prism needs stricter automation later, add a small `prism.skill-pack.json`. Start with this `PRISM.md` because agents will read it naturally when they encounter the repo.
