# Moloch Agent Simple

Use this skill for Agent of Moloch runtime work with `@raidguild/meta-clawtel`.

The old local `moloch-skills/moloch-shared/scripts/moloch.mjs` flow is now replaced by:

- local npm package: `@raidguild/meta-clawtel`
- binary: `moloch-agent`
- background service: `moloch-service`

The service handles DAOhaus Graph reads and Pinata-backed JSON pinning. The agent keeps signing local. Never send private keys, mnemonics, or raw signer material to the service.

## Required Local Secrets

- `ACCOUNT_ADDRESS`: the managed voter/account identity.
- `PRIVATE_KEY`: local signer for authorized transaction commands.

## Optional Runtime Settings

- `RPC_URL`: Base RPC for direct chain reads, preflight, and transaction sends.
- `MOLOCH_SERVICE_URL`: defaults to the hosted moloch-service.
- `CHAIN_ID`: defaults to `8453`.
- `MOLOCH_SEND_DEFAULT=false`: build unsigned transactions by default.
- `IPFS_GATEWAY_URL`: gateway for reading shared memory CIDs.

Graph and Pinata credentials should normally live in `moloch-service`, not in this agent.

## Core Commands

```bash
moloch-agent health
moloch-agent capabilities
moloch-agent dao --dao 0xDAO
moloch-agent proposals --dao 0xDAO --first 100
moloch-agent proposal --dao 0xDAO --proposal 1
moloch-agent members --dao 0xDAO --first 100
moloch-agent records --dao 0xDAO --table communityMemory --first 100
moloch-agent read-dao --dao 0xDAO
moloch-agent read-proposal --dao 0xDAO --proposal 1
moloch-agent proposal-lifecycle --dao 0xDAO --proposal 1
moloch-agent process-queue --dao 0xDAO --first 100
```

## Pinning And Memory

Use the service-backed pin command for public JSON artifacts:

```bash
moloch-agent pin-json --file community-state.json --name community-state-v1
```

Use Poster memory records for concise public coordination:

```bash
moloch-agent memory-post --dao 0xDAO --thread-id proposal-1 --body "Reason for vote"
```

Use DAO metadata proposals for shared memory pointers:

```bash
moloch-agent dao-meta --dao 0xDAO \
  --community-memory-uri ipfs://CID \
  --proposal-workspace-uri ipfs://CID \
  --shared-state-uri ipfs://CID
```

## Transaction Rules

Transaction commands broadcast by default. Use `--build-only` when review or dry-run mode is intended.

```bash
moloch-agent vote --dao 0xDAO --proposal 1 --approved true --build-only
moloch-agent sponsor --dao 0xDAO --proposal 1 --build-only
moloch-agent process-ready --dao 0xDAO --first 100 --build-only
moloch-agent process --dao 0xDAO --proposal 1 --proposal-data 0x... --build-only
```

Processing is settlement after governance. Do not block processing because a proposal touches membership, shares, loot, settings, payments, or other sensitive categories. Use `process-queue` or `process-ready`; those commands use direct chain state when `RPC_URL` is set.

Share and loot CLI amounts are human-unit for `mint-shares`, `join-dao`, and `tribute` unless a raw flag is used:

- `--amount 1` means 1 full 18-decimal voting share for `mint-shares`.
- `--shares 10000` means 10,000 voting shares for tribute/join flows.
- use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.

## Scheduled Task Pattern

For recurring work:

1. Sync local dashboard cache with `/app/api/sync/dao` or direct `moloch-agent` reads.
2. Read DAO database records with `moloch-agent records --table communityMemory`.
3. Read the mandate and shared memory pointers.
4. Choose one action: vote, sponsor, process, draft, memory-post, or no action.
5. Run live preflight with `proposal-lifecycle`, `read-proposal`, or `process-queue`.
6. Build unsigned when policy is not explicit; send only when mandate and harness policy allow it.
7. Reread state and post a concise memory record when useful.
