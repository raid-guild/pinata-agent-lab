# Moloch Agent Skills

This directory contains Codex skills and a shared script for interacting with DAOhaus/Moloch V3/Baal DAOs on Base.

For scheduled agent task patterns, see [AGENT_TASKS.md](AGENT_TASKS.md).
For vote reasoning, see [VOTE_DECISION_FLOW.md](VOTE_DECISION_FLOW.md).

Maintained repo: `https://github.com/HausDAO/moloch-skills`
DAOhaus Admin frontend implementation: `https://github.com/HausDAO/daohaus-admin`
Hosted DAOhaus Admin instance: `https://admin.daohaus.club/`

## Skills

- `moloch-shared`: shared wallet, RPC, Graph, encoding, decoding, and transaction helpers.
- `moloch-summon`: summon a new Moloch V3/Baal DAO.
- `moloch-proposals`: create signal, governance settings, token/admin settings, and custom proposals.
- `moloch-proposal-actions`: sponsor, vote, process, and cancel proposals.
- `moloch-dao-read`: read DAO/proposal state from contracts and the DAOhaus subgraph.
- `moloch-agent-conviction`: bootstrap and apply an agent governance mandate/voting policy.
- `meta-clawtel-launch`: specific launch instructions and params template for the Meta Clawtel DAO.

## Setup

Install script dependencies:

```bash
cd moloch-shared
npm install
node scripts/moloch.mjs --help
```

Check local capabilities and commit:

```bash
node scripts/moloch.mjs capabilities
```

If `tribute` / `join-dao` is missing from help or capabilities, the local bundle is stale.

## Environment

Required for direct contract reads and sending transactions:

```bash
export RPC_URL="https://mainnet.base.org"
```

This public RPC is a fallback for small tests and can rate limit quickly. For agents, use a dedicated RPC provider.

For a more reliable Base RPC, use Alchemy or another provider:

```bash
export RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
```

Required for autonomous action tasks or any transaction broadcast:

```bash
export PRIVATE_KEY="0x..."
```

Required for DAOhaus indexed reads:

```bash
export GRAPH_API_KEY="..."
```

Get a key from The Graph Studio, then use the Base DAOhaus subgraph endpoint:

```bash
export GRAPH_URL="https://gateway.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

Optional:

```bash
export CHAIN_ID="8453"
export GRAPH_URL="https://gateway.thegraph.com/api/<key>/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

Notes:

- `CHAIN_ID` defaults to `8453` for Base.
- `GRAPH_URL` can be used instead of `GRAPH_API_KEY`.
- `PRIVATE_KEY` is never needed for building unsigned transaction JSON.
- `GRAPH_URL` and `GRAPH_API_KEY` are read-only indexing inputs. They cannot submit transactions.
- Do not commit `.env` files, private keys, mnemonics, or raw signer credentials.
- For production use, prefer a pre-provisioned managed wallet or custody system. Local key generation is mainly for fresh operator or test wallets.
- Public RPCs are acceptable for one-off tests, but agents should use Alchemy, Infura, or another dedicated RPC for repeated reads.
- The Graph endpoint is documented by The Graph as `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>`.

## Base Constants

- Chain id: `8453`
- Hex chain id: `0x2105`
- Advanced token summoner: `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11`
- Poster: `0x000000000000cd17345801aa8147b8D3950260FF`
- DAOhaus Base subgraph id: `7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW`
- DAOhaus admin frontend: `https://github.com/HausDAO/daohaus-admin`

## Base Contract Addresses

These are the Base `0x2105` addresses from the DAOhaus admin contract keychain.

| Contract | Address | Use |
| --- | --- | --- |
| `V3_FACTORY_ADV_TOKEN` | `0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11` | Preferred summoner for DAOs with custom voting and loot tokens |
| `V3_FACTORY_ORIGINAL` | `0x22e0382194AC1e9929E023bBC2fD2BA6b778E098` | Original V3 summoner |
| `BAAL_SINGLETON` | `0xE0F33E95aF46EAd1Fe181d2A74919bff903cD5d4` | Baal implementation singleton |
| `SHARES_SINGLETON` | `0xc650B598b095613cCddF0f49570FfA475175A5D5` | Voting token singleton |
| `LOOT_SINGLETON` | `0x52acf023d38A31f7e7bC92cCe5E68d36cC9752d6` | Non-voting loot token singleton |
| `POSTER` | `0x000000000000cd17345801aa8147b8D3950260FF` | DAOhaus profile and proposal metadata posts |
| `TRIBUTE_MINION` | `0x00768B047f73D88b6e9c14bcA97221d6E179d468` | Tribute proposal helper |
| `VAULT_SUMMONER` | `0x2eF2fC8a18A914818169eFa183db480d31a90c5D` | Safe/vault summon helper |
| `GNOSIS_MULTISEND` | `0x998739BFdAAdde7C933B942a68053933098f9EDa` | MultiSend helper |
| `GNOSIS_SIGNLIB` | `0x98FFBBF51bb33A056B08ddf711f289936AafF717` | Safe signature helper |
| `ZODIAC_FACTORY` | `0x000000000000aDdB49795b0f9bA5BC298cDda236` | Zodiac module factory |

For Meta Clawtel summon, the critical address is `V3_FACTORY_ADV_TOKEN`. After summon, proposal actions go to the newly created Baal DAO address, not the summoner.

## Autonomy Model

This pack is intended for always-on DAO agents. In that mode, the agent should broadcast by default when all of these are true:

- the agent has a configured managed signer, `RPC_URL`, and gas funds
- the action is inside the agent's mandate, scheduled task, or harness policy
- direct chain preflight confirms the action is currently valid
- the action does not trigger an escalation rule in the agent mandate

The CLI still uses `--send` as the explicit execution bit. Agent skills should add `--send` for authorized actions unless the operator, task, or harness says to build only, dry-run, or draft. Read-only tasks never need a private key.

## Common Commands

Generate a fresh local Ethereum account:

```bash
node moloch-shared/scripts/moloch.mjs new-account
```

This prints a private key once. Store it securely before funding the address. The repo does not persist, encrypt, rotate, or recover generated keys.

Read direct contract state:

```bash
node moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO
node moloch-shared/scripts/moloch.mjs read-proposal --dao 0xDAO --proposal 1
```

Read indexed DAOhaus subgraph state:

```bash
node moloch-shared/scripts/moloch.mjs graph-dao --dao 0xDAO
node moloch-shared/scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs graph-proposals --dao 0xDAO --first 20
node moloch-shared/scripts/moloch.mjs graph-dao-history --dao 0xDAO --first 100
node moloch-shared/scripts/moloch.mjs graph-members --dao 0xDAO --first 100
node moloch-shared/scripts/moloch.mjs graph-member --dao 0xDAO --member 0xMEMBER
node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table daoProfile
node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table charter
node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table joinRules
node moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --out-dir /data/custom/moloch-skills/artifacts/0xDAO
node moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs process-queue --dao 0xDAO --first 100
```

Build proposal details or decode proposal calldata:

```bash
node moloch-shared/scripts/moloch.mjs details --title "Title" --description "Body" --proposal-type SIGNAL
node moloch-shared/scripts/moloch.mjs decode-submit-proposal --data 0xFULL_CALLDATA
node moloch-shared/scripts/moloch.mjs decode-proposal-data --data 0xINNER_PROPOSAL_DATA
```

Build or broadcast transactions:

```bash
node moloch-shared/scripts/moloch.mjs signal --dao 0xDAO --title "Signal" --description "Body"
node moloch-shared/scripts/moloch.mjs dao-meta --dao 0xDAO --name "DAO Name" --charter-uri ipfs://... --join-rules-uri ipfs://...
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table charter --content-file charter-record.json
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table joinRules --content-file join-rules-record.json
node moloch-shared/scripts/moloch.mjs tribute --dao 0xDAO --token ETH --amount 1000000000000000 --shares 0 --loot 1000000000000000000000
node moloch-shared/scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
node moloch-shared/scripts/moloch.mjs token-settings --dao 0xDAO --pause-shares false --pause-loot false
node moloch-shared/scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node moloch-shared/scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
node moloch-shared/scripts/moloch.mjs summon --params summon.json
```

Append `--send` for authorized autonomous broadcasts. Omit it for dry-run/review/draft mode.

Autonomous action example:

```bash
node moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true --send
```

With 1Password CLI, avoid exporting the key into the shell:

```bash
node moloch-shared/scripts/moloch.mjs vote \
  --dao 0xDAO \
  --proposal 1 \
  --approved true \
  --send \
  --vault-provider 1password \
  --vault-item "Moloch Agent Wallet" \
  --vault-field private_key
```

Do not print the revealed key. The CLI reads it in-process and uses it only for the signed transaction.

## Operator Output Style

Agents should default to concise, human-readable summaries. Do not paste full ABI fragments, large calldata blobs, or raw Graph JSON unless the operator asks for them.
Use `--compact` for CLI output intended for operators.

Good default output:

- command run
- relevant defaults used
- whether the tx was broadcast or intentionally left unsigned
- target contract/address
- value in ETH/wei
- risk, policy reason, or escalation needed
- tx hash after broadcast

Raw JSON/calldata should be saved to a file or shown only on request.

## Proposal Intent Guardrail

Use `signal` only for text-only governance intent. If the operator asks to join, request shares, request loot, create a membership proposal, or make a tribute proposal, use `tribute` / `join-dao`. A signal about shares does not issue shares.

Use `dao-meta` or `dao-record` for DAO profile, charter, manifesto, hosted docs, and join-rule pointers.

## Onchain Submission Requirements

To submit any transaction onchain, including summoning Meta Clawtel, the agent needs:

```bash
export RPC_URL="https://mainnet.base.org"
export PRIVATE_KEY="0x..."
```

`RPC_URL` is used to get the wallet nonce, estimate/send gas fields, broadcast the signed transaction, and read transaction status. `PRIVATE_KEY` signs the transaction from the managed wallet.

The managed wallet must also have Base ETH for gas. If the action requires DAO permissions, the wallet must have the relevant shares, delegation, shaman permission, or proposal rights before sending.

Graph config is separate and read-only:

```bash
export GRAPH_URL="https://gateway.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

## DAO Metadata, Charter, And Join Rules

Summon posts initial DAO profile metadata through Poster. The summon params may include optional metadata fields:

```json
{
  "daoName": "Example DAO",
  "description": "Short public description",
  "goalsURI": "ipfs://...",
  "charterURI": "ipfs://...",
  "joinRulesURI": "ipfs://..."
}
```

For richer or changing rules, use Poster/DAO records and proposal ratification:

- `daoProfile`: current profile and links.
- `charter`: current charter pointer/version/hash.
- `joinRules`: how agents or humans request membership.

Routine snapshots write `dao-records.json` and `operating-context.json` so agents can see the current charter/join-rules context without rereading long proposal history.

Example charter record:

```json
{
  "title": "Meta Clawtel Charter",
  "version": "0.1.0",
  "uri": "ipfs://...",
  "contentHash": "bafy...",
  "summary": "Alignment, onboarding, distribution, and rules of engagement."
}
```

Example join-rules record:

```json
{
  "title": "Meta Clawtel Join Rules",
  "version": "0.1.0",
  "token": "ETH",
  "tributeAmount": "1000000000000000",
  "sharesRequested": "1000000000000000000000",
  "expectations": ["align with charter", "contribute to onboarding or distribution", "participate in votes"]
}
```

## Membership Context

Use member reads to understand who has shares/loot, delegation, and vote history:

```bash
node moloch-shared/scripts/moloch.mjs graph-members --dao 0xDAO --first 100
node moloch-shared/scripts/moloch.mjs graph-member --dao 0xDAO --member 0xMEMBER
```

`task-snapshot` also writes `membership-summary.json`.

## Operational Concerns

- Autonomous agents should send by default for authorized actions after preflight. Leave transactions unsigned only when the task/operator asks for dry-run, review, or draft mode.
- The CLI requires `--send` to broadcast; this is a mechanical execution flag, not a human-confirmation requirement for authorized agent tasks.
- Read direct contract state immediately before sending. Graph data can lag.
- Use Graph data for proposal metadata, votes, and the original indexed `proposalData`.
- Use Graph member data for membership, shares, loot, delegation, and vote history context.
- Use direct contract reads for permission, timing, and current threshold checks.
- Governance `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values.
- Use `graph-dao-history` for broad proposal history instead of looping over direct RPC reads.
- For `processProposal`, use the exact `proposalData` from the indexed proposal. Do not reconstruct it if Graph has the original payload.
- Include the DAO's `proposalOffering` as transaction value when submitting proposals unless it is zero.
- Confirm the managed wallet has Base ETH for gas and the required DAO permissions or voting power.
- Record the tx hash and re-read state after confirmation.

## Current Limitations

- The shared script is intentionally Base-first.
- It covers common DAOhaus/Moloch V3 proposal flows, not every possible shaman or Safe interaction.
- Gas estimation is not a full replacement for simulation. For high-value transactions, simulate with a dedicated tool before broadcasting.
- Graph reads require a The Graph Gateway API key unless a full `GRAPH_URL` is supplied.
- The script stores no wallet state and does not manage key rotation, policy approvals, spending limits, or multisig custody.
