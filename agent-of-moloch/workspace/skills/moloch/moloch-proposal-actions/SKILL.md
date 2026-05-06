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
4. Build the unsigned tx.
5. Send only when the user explicitly asks and the wallet has permission.
6. Re-read the proposal after confirmation.

## Commands

Sponsor:

```bash
node ../moloch-shared/scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
```

Vote:

```bash
node ../moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node ../moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved false
```

Process:

```bash
node ../moloch-shared/scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
```

For processing, get `proposalData` from `graph-proposal`. Decode it before sending if there is any ambiguity:

```bash
node ../moloch-shared/scripts/moloch.mjs decode-proposal-data --data 0xPROPOSAL_DATA
```

Cancel:

```bash
node ../moloch-shared/scripts/moloch.mjs cancel --dao 0xDAO --proposal 1
```

Add `--send` only to broadcast.

## Eligibility

- Sponsor requires delegated voting tokens at or above `sponsorThreshold`.
- Vote requires current voting power and an active voting period.
- Process requires the proposal to be ready for processing and needs the exact original Graph-indexed `proposalData`.
- Cancel is usually proposer, sponsor-below-threshold, or governance shaman behavior.

If eligibility is unclear, read Daohaus indexed state from the frontend/subgraph before sending.
