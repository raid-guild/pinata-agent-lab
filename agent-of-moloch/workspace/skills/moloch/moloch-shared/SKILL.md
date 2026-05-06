---
name: moloch-shared
description: Shared Base-first Moloch V3/Baal wallet, RPC, ABI, and transaction-building workflow. Use when an agent needs managed Ethereum account setup, Base contract addresses, unsigned tx objects, calldata, or execution conventions for DAOhaus/Moloch contracts.
---

# Moloch Shared Toolkit

Use this with the other `moloch-*` skills. Default network is Base mainnet.

## Managed Wallet

Use a managed account only through environment variables or an existing signer service.

- Required for sending: `PRIVATE_KEY` and `RPC_URL`
- Required for Daohaus indexed reads: `GRAPH_API_KEY`, or pass `--graph-url`
- Optional: `CHAIN_ID`, defaults to `8453`
- Never print, commit, or paste private keys or mnemonics.
- Default to building unsigned tx objects. Send only when the user explicitly asks to broadcast.
- Before sending, read the DAO/proposal state and confirm the action is valid.

## Base Addresses

- Base chain id: `8453`, hex `0x2105`
- Advanced token summoner: `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`
- Poster: `0x000000000000cd17345801aa8147b8D3950260FF`
- DAOhaus frontend source: `https://github.com/HausDAO/daohaus-admin`
- Daohaus routes: `/summon` and `/molochv3/:daochain/:daoid`

## Script

Use `scripts/moloch.mjs` from this skill directory. It uses `viem`.

```bash
cd /home/dekanjbrown/Projects/raidguild/skills/moloch/moloch-shared
npm install
node scripts/moloch.mjs --help
```

The script prints JSON. Without `--send`, commands return `{ to, value, data, chainId }`.

Common commands:

```bash
node scripts/moloch.mjs new-account
node scripts/moloch.mjs read-dao --dao 0xDAO
node scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
node scripts/moloch.mjs graph-dao --dao 0xDAO
node scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1
node scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node scripts/moloch.mjs details --title "..." --description "..." --proposal-type SIGNAL
node scripts/moloch.mjs decode-proposal-data --data 0x...
node scripts/moloch.mjs decode-submit-proposal --data 0x...
node scripts/moloch.mjs signal --dao 0xDAO --title "..." --description "..."
node scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
node scripts/moloch.mjs token-settings --dao 0xDAO --pause-shares false --pause-loot false
node scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
node scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
node scripts/moloch.mjs summon --params summon.json
```

Add `--send` only after reviewing the tx JSON and confirming the managed wallet has permission and funds.

## Proposal Data

Moloch V3 proposals call `submitProposal(bytes proposalData, uint32 expiration, uint256 baalGas, string details)`.

- `proposalData` is usually a Gnosis MultiSend `multiSend(bytes)` call encoded against the MultiSend ABI.
- Signal proposals post metadata through Poster.
- Governance settings encode `setGovernanceConfig(bytes)` where the inner bytes are:
  `uint32 votingPeriodInSeconds, uint32 gracePeriodInSeconds, uint256 newOffering, uint256 quorum, uint256 sponsorThreshold, uint256 minRetention`.
- `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values. Use `30` for 30%, `50` for 50%, and `67` for an approximate 66.6% retention guard.
- Token settings encode `setAdminConfig(bool pauseShares, bool pauseLoot)`.
- `details` is a JSON string with title, description, optional `contentURI`, `contentURIType`, and `proposalType`.

Use `details` to create valid proposal details JSON. Use `decode-submit-proposal` on a full `submitProposal` calldata value. Use `decode-proposal-data` on the inner `proposalData` only.

## Graph Reads

Daohaus uses The Graph Gateway for indexed DAO data. Base DAOhaus subgraph id:
`7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW`.

Use Graph reads for:

- proposal metadata: `details`, `title`, `description`, `proposalType`
- indexed `proposalData` needed for processing
- vote history and member vote balances
- Safe/vault/shaman lists and DAO profile data

Use direct contract reads for:

- permission/timing preflight immediately before sending
- raw `proposalOffering`, `sponsorThreshold`, `proposalCount`
- chain truth when Graph indexing lags

## Safety Checks

Before broadcasting:

1. Verify the chain is Base and the DAO address is the intended Baal contract.
2. Read `proposalOffering`; include that value when submitting proposals unless intentionally overriding.
3. For sponsor/vote/process/cancel, read the proposal first and check status fields.
4. If processing, use the exact Graph-indexed `proposalData` for that proposal. Do not reconstruct it from memory if indexed data is available.
5. Record the returned tx hash and re-read state after confirmation.
