---
name: moloch-summon
description: Summon DAOhaus/Moloch V3/Baal DAOs on Base with a managed Ethereum account. Use for creating a DAO, assembling summonBaalFromReferrer transactions, initial members, voting/loot token settings, governance settings, shamans, and summon metadata.
---

# Moloch Summon

Use this skill to build or send a Base Moloch V3 DAO summon transaction.

## Workflow

1. Use `../moloch-shared` for wallet/RPC setup and the shared script.
2. Collect summon params in a JSON file. Use base units for token balances and thresholds.
3. Create or identify the DAO shared memory root and include its CID in summon metadata when available.
4. Build the tx summary:
   `node ../moloch-shared/scripts/moloch.mjs summon --params summon.json --compact`
5. Check `to`, `value`, and chain id. `to` should be Base advanced token summoner `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`.
6. Send with the managed wallet when the params match the intended DAO:
   `node ../moloch-shared/scripts/moloch.mjs summon --params summon.json --send`
7. Record the tx hash. After confirmation, locate the new Baal address from logs or the indexer/frontend.

## Params Shape

```json
{
  "daoName": "Example DAO",
  "tokenName": "Example Voting",
  "tokenSymbol": "EXV",
  "lootTokenName": "Example Loot",
  "lootTokenSymbol": "EXL",
  "description": "Short public DAO description",
  "communityMemoryURI": "ipfs://...",
  "proposalWorkspaceURI": "ipfs://.../proposals",
  "sharedStateURI": "ipfs://.../versions/0001/community-state.md",
  "votingTransferable": false,
  "nvTransferable": true,
  "memberAddresses": ["0x..."],
  "memberShares": ["1000000000000000000"],
  "memberLoot": ["0"],
  "votingPeriodInSeconds": 604800,
  "gracePeriodInSeconds": 604800,
  "newOffering": "0",
  "quorum": "50",
  "sponsorThreshold": "0",
  "minRetention": "66",
  "shamanAddresses": [],
  "shamanPermissions": [],
  "safeAddress": "0x0000000000000000000000000000000000000000"
}
```

## Notes

- Daohaus summon uses `summonBaalFromReferrer(safe, forwarder, saltNonce, mintParams, tokenParams, initActions)`.
- Init actions include `setGovernanceConfig`, `setShamans`, and a Poster metadata post executed as Baal.
- Initial metadata should include `description`, `communityMemoryURI`, `proposalWorkspaceURI`, and `sharedStateURI` when available. Use one versioned `community-state.md` file for the DAO's rolling state.
- Use `../SHARED_MEMORY.md` and `../templates/community-memory` to create the shared memory root before summon. If the root is not ready at summon, publish it later with a `dao-meta` proposal.
- IPFS is immutable. To change shared state, create a new version directory and publish a new CID.
- If no Safe exists yet, leave `safeAddress` unset or zero.
- Use Base first. Do not switch chains unless the user asks.
- `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values.
