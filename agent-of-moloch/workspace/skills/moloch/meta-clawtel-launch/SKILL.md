---
name: meta-clawtel-launch
description: Launch the specific Meta Clawtel DAO on Base using DAOhaus/Moloch V3/Baal. Use when summoning or preparing the Meta Clawtel DAO with CLAW voting token, 4 hour voting/grace periods, 3 founding members, 10,000 initial shares each, .01 ETH proposal offering, quorum/sponsor/min-retention defaults, and a managed Ethereum wallet.
---

# Meta Clawtel Launch

Use this skill only for launching the Meta Clawtel DAO.

## Dependencies

Use these sibling skills:

- `../moloch-shared` for wallet/RPC setup and the transaction script.
- `../moloch-summon` for general summon flow.

## Fixed Launch Settings

- DAO name: `Meta Clawtel`
- Voting token name: `Meta Clawtel`
- Voting token symbol: `CLAW`
- Loot token name: `Meta Clawtel Loot`
- Loot token symbol: `CLAWLOOT`
- Initial metadata: include description plus IPFS pointers for goals, charter, join rules, and manifesto when available.
- Voting token transferable: `false`
- Loot token transferable: `true`
- Voting period: `4 hours` = `14400` seconds
- Grace period: `4 hours` = `14400` seconds
- Initial members: `3`
- Initial voting shares per member: `10000 CLAW`
- Initial loot per member: `0`
- Proposal offering: `.01 ETH` = `10000000000000000` wei
- Quorum: `50%` = `50`
- Sponsor threshold: `10000 CLAW` = `10000000000000000000000`
- Minimum retention: approximately `66.6%`, encoded as whole-number `67`
- Shamans: none initially
- Network: Base, chain id `8453`

The three member addresses are intentionally placeholders until the launcher provides them.
The IPFS CIDs are placeholders until the operator publishes docs through Pinata or another pinning flow.

## Initial Metadata Themes

Use concise metadata and CIDs rather than long text directly in summon params:

- Charter: alignment, voting expectations, proposal etiquette, and rules of engagement.
- Join rules: example `X ETH tribute for Y shares`, expected contribution area, and review process.
- Goals: initial focus on onboarding, distribution, and agent-readable operating context.
- Manifesto: narrative layer for why the DAO exists.

## Address Collection

Before building the final transaction, collect:

```text
FOUNDER_1_ADDRESS=0x...
FOUNDER_2_ADDRESS=0x...
FOUNDER_3_ADDRESS=0x...
```

Validate:

- all three are valid Ethereum addresses
- no duplicates
- the deployer confirms each address should receive `10000 CLAW`

## Build Params

Copy `assets/meta-clawtel-summon.template.json` to a working file, replace the three placeholder addresses, then build:

```bash
cd /home/dekanjbrown/Projects/raidguild/skills/moloch
node moloch-shared/scripts/moloch.mjs summon --params meta-clawtel-summon.json
```

Review the unsigned transaction:

- `chainId` must be `8453`
- `to` must be Base advanced token summoner `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`
- `value` must be `0`
- member arrays must have exactly 3 entries

Broadcast only when explicitly requested:

```bash
node moloch-shared/scripts/moloch.mjs summon --params meta-clawtel-summon.json --send
```

## Post-Launch

After confirmation:

1. Get the new Baal DAO address from logs or Daohaus indexing.
2. Read direct state:
   `node moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO`
3. Read indexed state once Graph catches up:
   `node moloch-shared/scripts/moloch.mjs graph-dao --dao 0xDAO`
4. Confirm proposal offering, quorum, sponsor threshold, voting/grace periods, and token names.
5. Confirm indexed metadata records:
   `node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table daoProfile`
6. Save the DAO route:
   `/molochv3/0x2105/0xDAO`

## Follow-Up Metadata Proposals

If CIDs are not ready at summon time, propose them later:

```bash
node moloch-shared/scripts/moloch.mjs dao-meta \
  --dao 0xDAO \
  --name "Meta Clawtel" \
  --charter-uri ipfs://... \
  --join-rules-uri ipfs://... \
  --goals-uri ipfs://...
```

For detailed records:

```bash
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table charter --content-file charter-record.json
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table joinRules --content-file join-rules-record.json
```

## Settings Rationale

- `10000 CLAW` sponsor threshold means any founding member can sponsor a proposal, but a non-member or dust holder cannot.
- `50%` quorum keeps execution possible with three founders while still requiring meaningful participation.
- `67%` min retention is the closest whole-number encoding for a two-thirds style retention guard.
- `.01 ETH` proposal offering adds a small cost to proposal creation without being a major barrier on Base.
