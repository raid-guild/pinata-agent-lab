---
name: moloch-shared
description: Shared Base-first Moloch V3/Baal wallet, RPC, ABI, and transaction execution workflow. Use when an agent needs managed Ethereum account setup, Base contract addresses, transaction objects, calldata, or execution conventions for DAOhaus/Moloch contracts.
---

# Moloch Shared Toolkit

Use this with the other `moloch-*` skills. Default network is Base mainnet.

## Managed Wallet

Use a managed account only through environment variables or an existing signer service.

- Required for sending: `PRIVATE_KEY` and `RPC_URL`
- Required for Daohaus indexed reads: `GRAPH_API_KEY`, or pass `--graph-url`
- Optional: `CHAIN_ID`, defaults to `8453`
- Never print, commit, or paste private keys or mnemonics.
- Autonomous agents should broadcast authorized actions by default after preflight. Use build-only mode when the operator, task, or harness asks for dry-run, review, or draft mode.
- The CLI still requires `--send` as the explicit execution flag. In autonomous action tasks, add `--send` unless broadcast is outside policy.
- Before sending, read the DAO/proposal state and confirm the action is valid.

## Base Addresses

- Base chain id: `8453`, hex `0x2105`
- Advanced token summoner: `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`
- Poster: `0x000000000000cd17345801aa8147b8D3950260FF`
- Moloch skills source: `https://github.com/HausDAO/moloch-skills`
- DAOhaus frontend source: `https://github.com/HausDAO/daohaus-admin`
- DAOhaus hosted admin: `https://admin.daohaus.club/`
- Daohaus routes: `/summon` and `/molochv3/:daochain/:daoid`

## Script

Use `scripts/moloch.mjs` from this skill directory. It uses `viem`.

```bash
cd /home/dekanjbrown/Projects/raidguild/skills/moloch/moloch-shared
npm install
node scripts/moloch.mjs --help
```

The script prints JSON. Without `--send`, commands return `{ to, value, data, chainId }`.
Use `--compact` for operator-facing output that hides large calldata fields.

Common commands:

```bash
node scripts/moloch.mjs capabilities
node scripts/moloch.mjs new-account
node scripts/moloch.mjs read-dao --dao 0xDAO
node scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
node scripts/moloch.mjs graph-dao --dao 0xDAO
node scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1
node scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node scripts/moloch.mjs graph-dao-history --dao 0xDAO --first 100
node scripts/moloch.mjs graph-members --dao 0xDAO --first 100
node scripts/moloch.mjs graph-member --dao 0xDAO --member 0xMEMBER
node scripts/moloch.mjs graph-records --dao 0xDAO --table daoProfile
node scripts/moloch.mjs graph-records --dao 0xDAO --table charter
node scripts/moloch.mjs graph-records --dao 0xDAO --table joinRules
node scripts/moloch.mjs task-snapshot --dao 0xDAO --out-dir /data/custom/moloch-skills/artifacts/0xDAO
node scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
node scripts/moloch.mjs process-queue --dao 0xDAO --first 100
node scripts/moloch.mjs details --title "..." --description "..." --proposal-type SIGNAL
node scripts/moloch.mjs decode-proposal-data --data 0x...
node scripts/moloch.mjs decode-submit-proposal --data 0x...
node scripts/moloch.mjs signal --dao 0xDAO --title "..." --description "..."
node scripts/moloch.mjs dao-meta --dao 0xDAO --name "DAO Name" --charter-uri ipfs://... --join-rules-uri ipfs://...
node scripts/moloch.mjs dao-record --dao 0xDAO --table charter --content-file charter-record.json
node scripts/moloch.mjs tribute --dao 0xDAO --token ETH --amount 1000000000000000 --shares 0 --loot 1000
node scripts/moloch.mjs mint-shares --dao 0xDAO --to 0xMEMBER --amount 10000
node scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
node scripts/moloch.mjs token-settings --dao 0xDAO --pause-shares false --pause-loot false
node scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
node scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
node scripts/moloch.mjs summon --params summon.json
```

For autonomous action skills, add `--send` after live preflight confirms the managed wallet has permission and funds. Omit `--send` only for dry-run/review/draft tasks or when policy blocks broadcast.

Proposal builders default `submitProposal` `baalGas` to `0`. Baal ignores zero, while a low nonzero value can make processing fail with an out-of-gas style action failure. Use `--baal-gas` only when you know the required inner action gas. Use `--estimate-baal-gas` to opt in to DAOhaus-style estimation with a default `1.2x` buffer.

For `process`, the CLI sets a transaction gas limit because wallet/RPC estimation can undercount inner proposal actions. Default is the larger of `800000` or stored `baalGas + 400000`. Override with `--gas-limit`.

For Baal shares and loot, the CLI accepts human 18-decimal token units by default:

- `mint-shares --amount 10000` means 10,000 voting shares.
- `tribute --shares 1 --loot 1000` means 1 share and 1,000 loot.
- Use `--amount-raw`, `--shares-raw`, or `--loot-raw` only for exact base units.
- Tribute token `--amount` remains raw token units because ETH/ERC-20 decimals vary.

Lifecycle reference fixtures live in `fixtures/proposal-lifecycle.fixture.json`.

Use `--vault-provider 1password --vault-item <item> --vault-field private_key` with `--send` to load a private key from 1Password CLI without exporting `PRIVATE_KEY`.

## Operator Output

Default to abstract summaries for humans. Do not print ABI fragments, large calldata, or full Graph JSON unless the user asks. If raw data is needed for review, save it to a file and summarize the file path, target, value, and risk.

Use these helpers instead of raw tuple interpretation:

- `read-proposal` returns named `getProposalStatus` flags: `cancelled`, `processed`, `passed`, `actionFailed`.
- `proposal-lifecycle` derives statuses such as `unsponsored`, `voting`, `grace`, `needsProcessing`, `failed`, and `processedPassed`.
- `process-queue` sorts ready proposals oldest first.

## Proposal Data

Moloch V3 proposals call `submitProposal(bytes proposalData, uint32 expiration, uint256 baalGas, string details)`.

- `proposalData` is usually a Gnosis MultiSend `multiSend(bytes)` call encoded against the MultiSend ABI.
- Signal proposals post metadata through Poster.
- Direct membership grants encode `mintShares(address[],uint256[])` against the Baal DAO.
- Baal shares and loot have 18 decimals. Proposal command summaries include both the original human input and the encoded raw amount where relevant.
- Governance settings encode `setGovernanceConfig(bytes)` where the inner bytes are:
  `uint32 votingPeriodInSeconds, uint32 gracePeriodInSeconds, uint256 newOffering, uint256 quorum, uint256 sponsorThreshold, uint256 minRetention`.
- `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values. Use `30` for 30%, `50` for 50%, and `67` for an approximate 66.6% retention guard.
- Token settings encode `setAdminConfig(bool pauseShares, bool pauseLoot)`.
- `details` is a JSON string with title, description, optional `contentURI`, `contentURIType`, and `proposalType`.

Use `details` to create valid proposal details JSON. Use `decode-submit-proposal` on a full `submitProposal` calldata value. Use `decode-proposal-data` on the inner `proposalData` only.

## Graph Reads

Daohaus uses The Graph Gateway for indexed DAO data. Base DAOhaus subgraph id:
`7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW`.

Use:

```bash
https://gateway.thegraph.com/api/<api-key>/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW
```

Use Graph reads for:

- proposal metadata: `details`, `title`, `description`, `proposalType`
- indexed `proposalData` needed for processing
- vote history and member vote balances
- Safe/vault/shaman lists and DAO profile data
- broad proposal history with `graph-dao-history`
- membership, delegation, shares, loot, and member vote history with `graph-members`
- charter/join-rules/profile records with `graph-records`

Use direct contract reads for:

- permission/timing preflight immediately before sending
- raw `proposalOffering`, `sponsorThreshold`, `proposalCount`
- chain truth when Graph indexing lags
- `state(prevProposalId)` gating before processing proposals

## Safety Checks

Before broadcasting:

1. Verify the chain is Base and the DAO address is the intended Baal contract.
2. Read `proposalOffering`; include that value when submitting proposals unless intentionally overriding.
3. For sponsor/vote/process/cancel, read the proposal first and check status fields.
4. If processing, use the exact Graph-indexed `proposalData` for that proposal. Do not reconstruct it from memory if indexed data is available.
5. Record the returned tx hash and re-read state after confirmation.
