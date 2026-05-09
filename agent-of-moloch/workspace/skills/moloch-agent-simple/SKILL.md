# Moloch Agent Simple

Use this skill for Agent of Moloch runtime work with `@raidguild/meta-clawtel`.

The old local `moloch-skills/moloch-shared/scripts/moloch.mjs` flow is now replaced by:

- local npm package: `@raidguild/meta-clawtel`
- binary invocation from the template root: `npm exec -- moloch-agent`
- background service: `moloch-service`

The service handles DAOhaus Graph reads and Pinata-backed JSON pinning. The agent keeps signing local. Never send private keys, mnemonics, or raw signer material to the service.

## Required Local Secrets

- `ACCOUNT_ADDRESS`: the managed voter/account identity.
- `PRIVATE_KEY`: local signer for authorized transaction commands.

## Optional Runtime Settings

- `RPC_URL`: optional Base RPC override. Defaults to `https://mainnet.base.org`; use a dedicated provider for always-on agents.
- `MOLOCH_SERVICE_URL`: defaults to the hosted moloch-service.
- `CHAIN_ID`: defaults to `8453`.
- `MOLOCH_SEND_DEFAULT=false`: build unsigned transactions by default.
- `IPFS_GATEWAY_URL`: gateway for reading shared memory CIDs.

Graph and Pinata credentials should normally live in `moloch-service`, not in this agent.

If `moloch-agent` is not found as a bare shell command, do not treat that as a missing package. Use `npm exec -- moloch-agent ...` from the template root so npm resolves the local `node_modules/.bin` binary.

## Bootstrap

On first run:

1. Ask for the DAO address or summon intent.
2. Ask for the agent name, character voice, mandate, autonomy boundaries, and no-action rules.
3. Ask for known `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI` pointers.
4. Confirm `ACCOUNT_ADDRESS`, `PRIVATE_KEY`, and whether `MOLOCH_SEND_DEFAULT=false` should be set.
5. Run `npm exec -- moloch-agent health` and `npm exec -- moloch-agent capabilities`.
6. Run `/app/api/sync/dao` or `npm exec -- moloch-agent dao`, `proposals`, `records`, and `process-queue`.
7. Store the DAO charter/thesis, voter platform, shared-memory pointers, and sync status in the dashboard cache.

Bootstrap is complete when the agent has a real DAO address, a signer identity, a mandate, a shared-memory plan or pointer, and a successful service-backed sync.

## Core Commands

```bash
npm exec -- moloch-agent health
npm exec -- moloch-agent capabilities
npm exec -- moloch-agent dao --dao 0xDAO
npm exec -- moloch-agent proposals --dao 0xDAO --first 100
npm exec -- moloch-agent proposal --dao 0xDAO --proposal 1
npm exec -- moloch-agent members --dao 0xDAO --first 100
npm exec -- moloch-agent records --dao 0xDAO --table communityMemory --first 100
npm exec -- moloch-agent read-dao --dao 0xDAO
npm exec -- moloch-agent read-proposal --dao 0xDAO --proposal 1
npm exec -- moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
npm exec -- moloch-agent process-queue --dao 0xDAO --first 100
```

## Vote Decision Flow

Before recommending or casting a vote, produce a compact memo:

- DAO address and proposal id.
- Current lifecycle from `npm exec -- moloch-agent proposal-lifecycle`.
- Relevant DAO memory from `npm exec -- moloch-agent records --table communityMemory`.
- Mandate fit: yes/no/unclear.
- Hard-no checks, abstain conditions, and escalation triggers.
- Recommendation: yes, no, abstain, defer, or no action.
- Confidence and missing evidence.

Do not vote from title/description alone. If mandate fit is unclear, recommend `defer` and write the missing evidence.

## Pinning And Memory

Use the service-backed pin command for public JSON artifacts:

```bash
npm exec -- moloch-agent pin-json --file community-state.json --name community-state-v1
```

Use Poster memory records for concise public coordination:

```bash
npm exec -- moloch-agent memory-post --dao 0xDAO --thread-id proposal-1 --body "Reason for vote"
```

Use DAO metadata proposals for shared memory pointers:

```bash
npm exec -- moloch-agent dao-meta --dao 0xDAO \
  --community-memory-uri ipfs://CID \
  --proposal-workspace-uri ipfs://CID \
  --shared-state-uri ipfs://CID
```

Shared memory conventions:

- Short coordination goes to Poster records with `memory-post`.
- Larger state, drafts, and proposal workspaces should be JSON or markdown pinned with `pin-json`, then referenced by URI.
- `communityMemoryURI` is the root pointer for DAO-level shared memory.
- `proposalWorkspaceURI` is the root pointer for proposal drafts and supporting files.
- `sharedStateURI` is the current concise community-state document.

Minimal community state fields:

```json
{
  "daoName": "",
  "daoAddress": "",
  "purpose": "",
  "currentGoals": [],
  "rulesOfEngagement": [],
  "joinRules": "",
  "roles": [],
  "operatingFocus": "",
  "updatedAt": ""
}
```

## Transaction Rules

Transaction commands broadcast by default. Use `--build-only` when review or dry-run mode is intended.

```bash
npm exec -- moloch-agent vote --dao 0xDAO --proposal 1 --approved true --build-only
npm exec -- moloch-agent sponsor --dao 0xDAO --proposal 1 --build-only
npm exec -- moloch-agent process-ready --dao 0xDAO --first 100 --build-only
npm exec -- moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x... --build-only
npm exec -- moloch-agent signal --dao 0xDAO --title "Signal" --description "Body" --build-only
npm exec -- moloch-agent mint-shares --dao 0xDAO --to 0xMEMBER --amount 1 --build-only
```

Processing is settlement after governance. Do not block processing because a proposal touches membership, shares, loot, settings, payments, or other sensitive categories. Use `process-queue` or `process-ready`; those commands use direct chain state through the configured RPC, defaulting to the public Base RPC.

Share and loot CLI amounts are human-unit for `mint-shares`, `join-dao`, and `tribute` unless a raw flag is used:

- `--amount 1` means 1 full 18-decimal voting share for `mint-shares`.
- `--shares 10000` means 10,000 voting shares for tribute/join flows.
- use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.

## Scheduled Task Pattern

For recurring work:

1. Sync local dashboard cache with `/app/api/sync/dao` or direct `npm exec -- moloch-agent` reads.
2. Read DAO database records with `npm exec -- moloch-agent records --table communityMemory`.
3. Read the mandate and shared memory pointers.
4. Choose one action: vote, sponsor, process, draft, memory-post, or no action.
5. Run live preflight with `proposal-lifecycle`, `read-proposal`, or `process-queue`.
6. Build unsigned when policy is not explicit; send only when mandate and harness policy allow it.
7. Reread state and post a concise memory record when useful.
