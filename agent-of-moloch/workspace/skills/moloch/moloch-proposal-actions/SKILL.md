---
name: moloch-proposal-actions
description: Operate existing Moloch V3/Baal proposals on Base with a managed wallet. Use to sponsor, vote yes/no, process, cancel, or validate proposal action eligibility and build/sending transaction objects.
---

# Moloch Proposal Actions

Use this skill for proposal lifecycle actions.

## Workflow

1. Use `../moloch-shared` for wallet/RPC setup.
2. Read proposal state before acting:
   `node ../moloch-shared/scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1`
3. Read indexed proposal details before acting:
   `node ../moloch-shared/scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1`
4. Derive lifecycle before acting:
   `node ../moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1`
5. If the action is inside the agent mandate/harness policy, broadcast with `--send`.
6. Build unsigned only when the task asks for dry-run/review/draft mode or policy blocks broadcast.
7. Re-read the proposal after confirmation and record the tx hash.

## Commands

Sponsor:

```bash
node ../moloch-shared/scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1 --send
```

Vote:

```bash
node ../moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true --send
node ../moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved false --send
```

Process:

```bash
node ../moloch-shared/scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x... --send
```

For processing, get `proposalData` from `graph-proposal`. Decode it before sending if there is any ambiguity:

```bash
node ../moloch-shared/scripts/moloch.mjs decode-proposal-data --data 0xPROPOSAL_DATA
```

Queue processing oldest ready proposal first:

```bash
node ../moloch-shared/scripts/moloch.mjs process-queue --dao 0xDAO --first 100
```

Cancel:

```bash
node ../moloch-shared/scripts/moloch.mjs cancel --dao 0xDAO --proposal 1 --send
```

Omit `--send` only for dry-run/review mode.

## Eligibility

- Sponsor requires delegated voting tokens at or above `sponsorThreshold`.
- Vote requires current voting power and an active voting period.
- Process requires `proposal-lifecycle` to show `processableNow: true` and needs the exact original Graph-indexed `proposalData`.
- Do not treat indexed `passed` alone as ready to process. Check `graceEnds`, quorum, yes/no balance, processed flag, proposalData availability, and previous-proposal state.
- `process --send` runs lifecycle preflight by default when Graph/RPC are configured. Use `--skip-preflight` only for a deliberate expert override.

## Sponsor Then Vote Race

After sponsoring, do not immediately assume voting is available. Re-read `proposal-lifecycle` or poll briefly until status becomes `voting`. If an immediate vote reverts with `!determined`, wait and retry after state/indexing advances.
- Cancel is usually proposer, sponsor-below-threshold, or governance shaman behavior.

If eligibility is unclear, read Daohaus indexed state from the frontend/subgraph before sending.
