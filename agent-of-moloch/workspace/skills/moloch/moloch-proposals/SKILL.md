---
name: moloch-proposals
description: Build and submit Moloch V3/Baal proposals on Base. Use for DAOhaus signal proposals, governance setting changes, token/admin setting changes, tribute-style proposal planning, proposalData encoding, submitProposal tx objects, and proposal offering handling.
---

# Moloch Proposals

Use this skill to build or submit Baal proposals on Base.

## Workflow

1. Use `../moloch-shared` for RPC, wallet, and transaction script setup.
2. Read DAO state first:
   `node ../moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO`
3. Optionally read indexed DAO/proposal context with `graph-dao` or `graph-proposals`.
4. Include `proposalOffering` as tx value for `submitProposal` unless the DAO uses zero offering.
5. Build the proposal tx and review the JSON.
6. Decode the full calldata with `decode-submit-proposal` when reviewing complex proposals.
7. Send only when explicitly requested by adding `--send`.

## Details JSON

Build details independently when needed:

```bash
node ../moloch-shared/scripts/moloch.mjs details \
  --title "Signal title" \
  --description "Signal body" \
  --link "https://..." \
  --proposal-type SIGNAL
```

Daohaus expects details JSON with `title`, `description`, optional `contentURI`, `contentURIType`, and `proposalType`.

## Signal Proposal

```bash
node ../moloch-shared/scripts/moloch.mjs signal \
  --dao 0xDAO \
  --title "Signal title" \
  --description "Signal body" \
  --link "https://..." \
  --value 0
```

Signal proposals encode a Poster `post` action inside `submitProposal`.

## Governance Settings Proposal

Create `params.json`:

```json
{
  "title": "Update governance settings",
  "description": "Change voting and grace periods.",
  "votingPeriodInSeconds": 604800,
  "gracePeriodInSeconds": 604800,
  "newOffering": "0",
  "quorum": "50",
  "sponsorThreshold": "0",
  "minRetention": "66",
  "expiration": 0,
  "baalGas": "0",
  "value": "0"
}
```

Build:

```bash
node ../moloch-shared/scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
```

## Token/Admin Settings Proposal

Daohaus names this token settings, but the Baal call is `setAdminConfig(bool pauseShares, bool pauseLoot)`.

```bash
node ../moloch-shared/scripts/moloch.mjs token-settings \
  --dao 0xDAO \
  --pause-shares false \
  --pause-loot false \
  --title "Update token transfer settings"
```

## Custom Proposal

For custom action proposals, use the shared script pattern:

- Encode each action call with the target ABI.
- Pack actions into MultiSend bytes.
- Encode `multiSend(bytes)` as `proposalData`.
- Call `submitProposal(proposalData, expiration, baalGas, details)`.

Keep details JSON small and include `title`, `description`, optional `contentURI`, `contentURIType`, and `proposalType`.

For governance settings, `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`. Do not use 18-decimal fixed point values.

Review:

```bash
node ../moloch-shared/scripts/moloch.mjs decode-submit-proposal --data 0xFULL_CALLDATA
node ../moloch-shared/scripts/moloch.mjs decode-proposal-data --data 0xINNER_PROPOSAL_DATA
```
