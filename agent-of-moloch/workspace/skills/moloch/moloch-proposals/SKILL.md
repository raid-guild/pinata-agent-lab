---
name: moloch-proposals
description: Build and submit Moloch V3/Baal proposals on Base. Use for DAOhaus signal proposals, governance setting changes, token/admin setting changes, tribute-style proposal planning, proposalData encoding, submitProposal tx objects, and proposal offering handling.
---

# Moloch Proposals

Use this skill to build or submit Baal proposals on Base.

Default to high-level commands and concise summaries. Do not expose ABI fragments, raw calldata, or full JSON shapes unless the user asks for a technical review.

## Workflow

1. Use `../moloch-shared` for RPC, wallet, and transaction script setup.
2. Run proposal intent preflight before choosing a command.
3. Read DAO state first:
   `node ../moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO`
4. Optionally read indexed DAO/proposal context with `graph-dao` or `graph-proposals`.
5. Include `proposalOffering` as tx value for `submitProposal` unless the DAO uses zero offering.
6. Build the proposal tx and review the compact summary.
7. Decode the full calldata with `decode-submit-proposal` only when reviewing complex proposals or when asked.
8. For autonomous proposal tasks, broadcast with `--send` when the proposal is inside mandate/harness policy and live preflight passes. Omit `--send` only for dry-run, review, or draft mode.

## Proposal Intent Preflight

Choose the proposal path by operator intent:

| Operator asks for | Use |
| --- | --- |
| signal, temperature check, text-only governance intent | `signal` |
| join DAO with tribute, tokens-for-shares, tokens-for-loot | `tribute` / `join-dao` |
| grant or mint voting shares directly, no tribute involved | `mint-shares` |
| update DAO profile, charter URI, join rules URI, manifesto/docs links | `dao-meta` / `dao-record` |
| change voting period, grace period, offering, quorum, retention | `gov-settings` |
| change share/loot pause or transferability setting | `token-settings` |
| arbitrary contract execution | custom proposal path |

If the operator asks for shares, loot, membership, admission, or a join request, do not use `signal`. A signal can express support for admission, but it does not create an executable membership proposal. Use `tribute` / `join-dao` when the member contributes ETH or ERC-20 tribute. Use `mint-shares` when the DAO directly grants voting shares with no tribute transfer.

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

Proposal commands default `submitProposal` `baalGas` to `0`. This is intentional: Baal ignores a zero `baalGas`, while a low nonzero value can cause processing to fail with an out-of-gas style action failure. Use `--baal-gas` only when you know the required inner action gas. Use `--estimate-baal-gas` as an explicit opt-in for DAOhaus-style estimation with a default `1.2x` buffer.

```bash
node ../moloch-shared/scripts/moloch.mjs signal \
  --dao 0xDAO \
  --title "Signal title" \
  --description "Signal body" \
  --link "https://..." \
  --value 0 \
  --send
```

Signal proposals encode a Poster `post` action inside `submitProposal`.
They do not issue shares, issue loot, transfer funds, or admit members.

If DAOhaus Admin shows a Poster decoding error such as `Encoded function signature "0x..." not found on ABI`, treat it as a malformed action until proven otherwise. A valid Poster signal action uses `post(string,string)` with selector `0x0ae1b13d`. Run `decode-submit-proposal` or `decode-proposal-data`; the decoder annotates Poster actions and flags unknown selectors.

## Membership Proposal Types

DAOhaus has at least two common executable membership paths:

- `tribute` / `join-dao`: submits through Tribute Minion for tokens-for-shares or tokens-for-loot.
- `mint-shares`: submits a Baal proposal that calls `mintShares(address[],uint256[])` on the DAO itself.

Use `mint-shares` for grants, steward admissions, retroactive rewards, or membership approvals where no ETH/ERC-20 contribution should be escrowed by Tribute Minion.

Share and loot quantities use human 18-decimal units by default. Use `--amount 10000` for 10,000 shares, not `10000000000000000000000`. Use `--amount-raw`, `--shares-raw`, or `--loot-raw` only when you intentionally want exact base units.

```bash
node ../moloch-shared/scripts/moloch.mjs mint-shares \
  --dao 0xDAO \
  --to 0xMEMBER \
  --amount 1 \
  --title "Admit new voting member" \
  --description "Grant 1 voting share to the approved member." \
  --send
```

For multiple recipients, pass comma-separated values with matching lengths:

```bash
node ../moloch-shared/scripts/moloch.mjs mint-shares \
  --dao 0xDAO \
  --to 0xA,0xB \
  --amount 1,2.5 \
  --title "Mint contributor shares" \
  --send
```

## Tribute / Join DAO Proposal

Use this for tokens-for-shares or tokens-for-loot requests through the DAOhaus Tribute Minion.
This is the first-class membership/admission path when the member contributes ETH or ERC-20 tribute.

Native ETH tribute:

```bash
node ../moloch-shared/scripts/moloch.mjs tribute \
  --dao 0xDAO \
  --token ETH \
  --amount 1000000000000000 \
  --shares 0 \
  --loot 1000 \
  --title "Join the DAO" \
  --send
```

ERC-20 tribute:

```bash
node ../moloch-shared/scripts/moloch.mjs tribute \
  --dao 0xDAO \
  --token 0xTOKEN \
  --amount 1000000 \
  --shares 1 \
  --loot 0 \
  --send
```

For ERC-20 tribute, check and approve Tribute Minion allowance before broadcasting. For ETH tribute, tx `value` equals `amount`. Tribute token `--amount` remains raw token units because ERC-20 decimals vary; share/loot outputs use human 18-decimal units by default.

## DAO Metadata / Charter / Join Rules Proposal

Use this for DAOhaus-readable metadata and agent-readable rules.

Profile links:

```bash
node ../moloch-shared/scripts/moloch.mjs dao-meta \
  --dao 0xDAO \
  --name "DAO Name" \
  --charter-uri ipfs://... \
  --join-rules-uri ipfs://... \
  --goals-uri ipfs://... \
  --send
```

Custom records:

```bash
node ../moloch-shared/scripts/moloch.mjs dao-record \
  --dao 0xDAO \
  --table charter \
  --content-file charter-record.json \
  --send

node ../moloch-shared/scripts/moloch.mjs dao-record \
  --dao 0xDAO \
  --table joinRules \
  --content-file join-rules-record.json \
  --send
```

These build a proposal that posts a Poster record if passed. Use IPFS/Pinata CIDs for larger charter, manifesto, join rules, or hosted docs content.

Zero-tribute membership request example:

```bash
node ../moloch-shared/scripts/moloch.mjs join-dao \
  --dao 0xDAO \
  --token ETH \
  --amount 0 \
  --shares 10000 \
  --loot 0 \
  --title "Admit Charter Steward" \
  --send
```

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
node ../moloch-shared/scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json --send
```

## Token/Admin Settings Proposal

Daohaus names this token settings, but the Baal call is `setAdminConfig(bool pauseShares, bool pauseLoot)`.

```bash
node ../moloch-shared/scripts/moloch.mjs token-settings \
  --dao 0xDAO \
  --pause-shares false \
  --pause-loot false \
  --title "Update token transfer settings" \
  --send
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
