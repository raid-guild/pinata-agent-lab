---
name: moloch-summon
description: Summon DAOhaus/Moloch V3/Baal DAOs on Base with a managed Ethereum account. Use for creating a DAO, assembling summonBaalFromReferrer transactions, initial members, voting/loot token settings, governance settings, shamans, and summon metadata.
---

# Moloch Summon

Use this skill to build or send a Base Moloch V3 DAO summon transaction.

## Workflow

1. Use `../moloch-shared` for wallet/RPC setup and the shared script.
2. Collect summon params in a JSON file. Use base units for token balances and thresholds.
3. Build the tx first:
   `node ../moloch-shared/scripts/moloch.mjs summon --params summon.json`
4. Review `to`, `value`, `data`, and chain id. `to` should be Base advanced token summoner `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`.
5. Send only when explicitly requested:
   `node ../moloch-shared/scripts/moloch.mjs summon --params summon.json --send`
6. Record the tx hash. After confirmation, locate the new Baal address from logs or the indexer/frontend.

## Params Shape

```json
{
  "daoName": "Example DAO",
  "tokenName": "Example Voting",
  "tokenSymbol": "EXV",
  "lootTokenName": "Example Loot",
  "lootTokenSymbol": "EXL",
  "description": "Short public DAO description",
  "goalsURI": "ipfs://...",
  "charterURI": "ipfs://...",
  "joinRulesURI": "ipfs://...",
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
- Initial metadata can include `description`, `goalsURI`, `charterURI`, `joinRulesURI`, `rulesURI`, and image/link fields. Use IPFS/Pinata URIs for longer documents.
- If no Safe exists yet, leave `safeAddress` unset or zero.
- Use Base first. Do not switch chains unless the user asks.
- `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values.
