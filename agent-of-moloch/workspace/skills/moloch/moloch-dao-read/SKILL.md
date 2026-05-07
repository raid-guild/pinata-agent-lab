---
name: moloch-dao-read
description: Read Moloch V3/Baal DAO and proposal state on Base. Use for proposal counts, proposal offering, sponsor threshold, proposal structs, proposal status, DAOhaus route/state inspection, and preflight checks before proposals or votes.
---

# Moloch DAO Read

Use this skill before any write action.

## Basic Reads

Use the shared script:

```bash
node ../moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO
node ../moloch-shared/scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
node ../moloch-shared/scripts/moloch.mjs graph-dao --dao 0xDAO
node ../moloch-shared/scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1
node ../moloch-shared/scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node ../moloch-shared/scripts/moloch.mjs graph-dao-history --dao 0xDAO --first 100
node ../moloch-shared/scripts/moloch.mjs graph-members --dao 0xDAO --first 100
node ../moloch-shared/scripts/moloch.mjs graph-member --dao 0xDAO --member 0xMEMBER
node ../moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table charter
node ../moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table joinRules
node ../moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
node ../moloch-shared/scripts/moloch.mjs process-queue --dao 0xDAO --first 100
```

Required env:

```bash
export RPC_URL="https://base-mainnet..."
export GRAPH_API_KEY="..."
```

For Graph, you can pass `--graph-url` instead of `GRAPH_API_KEY`. The default Base DAOhaus endpoint is The Graph Gateway subgraph id `7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW`.
Use `https://gateway.thegraph.com/api/<api-key>/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW`.

## What To Check

Prefer Graph batch reads for history and context. Avoid looping over many direct RPC calls unless the user needs fresh contract truth for each item.

DAO-level:

- `proposalCount`
- `proposalOffering`
- `sponsorThreshold`
- `latestSponsoredProposalId`

Proposal-level:

- raw `proposals(id)` tuple
- named `getProposalStatus(id)` flags: `cancelled`, `processed`, `passed`, `actionFailed`
- derived lifecycle status from `proposal-lifecycle`
- whether the relevant action is currently valid
- exact `proposalData` for processing, preferably from the indexed proposal payload
- indexed `details`, `title`, `description`, `proposalType`, and vote history from Graph
- member `shares`, `loot`, delegation, and vote history from Graph
- DAO records such as `daoProfile`, `charter`, and `joinRules`

## Daohaus Frontend Context

DAOhaus admin uses routes like:

```text
/molochv3/0x2105/0xDAO
/molochv3/0x2105/0xDAO/proposals
/molochv3/0x2105/0xDAO/proposal/1
```

The frontend source is `https://github.com/HausDAO/daohaus-admin`. In that app, Baal is the Moloch V3 DAO contract, and proposal write methods are on the Baal address.

## Preflight Rule

Read before writing, write once, then read again after confirmation. If indexed state and direct contract state disagree, prefer direct contract state for permissions/timing and indexed state for metadata/action decoding.
