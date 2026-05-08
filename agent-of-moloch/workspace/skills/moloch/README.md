# Moloch Agent Skills

This directory contains Codex skills and a shared script for interacting with DAOhaus/Moloch V3/Baal DAOs on Base.

For scheduled agent task patterns, see [AGENT_TASKS.md](AGENT_TASKS.md).
For first-time agent setup, see [BOOTSTRAP.md](BOOTSTRAP.md).
For vote reasoning, see [VOTE_DECISION_FLOW.md](VOTE_DECISION_FLOW.md).
For IPFS-backed shared community memory, see [SHARED_MEMORY.md](SHARED_MEMORY.md).
For optional experiment flows, see [experiments/](experiments/).

Maintained repo: `https://github.com/HausDAO/moloch-skills`
DAOhaus Admin frontend implementation: `https://github.com/HausDAO/daohaus-admin`
Hosted DAOhaus Admin instance: `https://admin.daohaus.club/`

## Skills

- `moloch-shared`: shared wallet, RPC, Graph, encoding, decoding, and transaction helpers.
- `moloch-summon`: summon a new Moloch V3/Baal DAO.
- `moloch-proposals`: create signal, governance settings, token/admin settings, and custom proposals.
- `moloch-proposal-actions`: sponsor, vote, process, and cancel proposals.
- `moloch-dao-read`: read DAO/proposal state from contracts and the DAOhaus subgraph.
- `moloch-agent-conviction`: bootstrap and apply an agent mandate. Conviction is the values layer; the mandate is the concrete operating artifact.
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

If `tribute` / `join-dao` / `mint-shares` is missing from help or capabilities, the local bundle is stale.

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

This pack is intended for always-on DAO agents with managed wallets. In that mode, the agent is expected to act autonomously and broadcast transactions without waiting for operator approval when these are true:

- the agent has a configured managed signer, `RPC_URL`, and gas funds
- the action follows the agent's mandate, scheduled task, or harness configuration
- direct chain preflight confirms the action is currently valid

The CLI still uses `--send` as the explicit execution bit. Autonomous skills should add `--send` for write actions after live preflight passes. Build-only, dry-run, and draft modes are explicit exceptions, not the default. Read-only tasks never need a private key.

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
node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table signal
node moloch-shared/scripts/moloch.mjs graph-records --dao 0xDAO --table communityMemory
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
node moloch-shared/scripts/moloch.mjs dao-meta --dao 0xDAO --name "DAO Name" --community-memory-uri ipfs://... --shared-state-uri ipfs://.../versions/0001/community-state.md
node moloch-shared/scripts/moloch.mjs memory-post --dao 0xDAO --table communityMemory --thread-id proposal-1 --body "I support this direction." --send
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table charter --content-file charter-record.json
node moloch-shared/scripts/moloch.mjs dao-record --dao 0xDAO --table joinRules --content-file join-rules-record.json
node moloch-shared/scripts/moloch.mjs tribute --dao 0xDAO --token ETH --amount 1000000000000000 --shares 0 --loot 1000
node moloch-shared/scripts/moloch.mjs mint-shares --dao 0xDAO --to 0xMEMBER --amount 10000
node moloch-shared/scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
node moloch-shared/scripts/moloch.mjs token-settings --dao 0xDAO --pause-shares false --pause-loot false
node moloch-shared/scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node moloch-shared/scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
node moloch-shared/scripts/moloch.mjs summon --params summon.json
```

Append `--send` for autonomous broadcasts. Omit it only for explicit dry-run/review/draft mode or technical blockers.

For Baal shares and loot, CLI quantities are human 18-decimal token units by default. `mint-shares --amount 10000` encodes `10000000000000000000000`. `tribute --shares 1 --loot 1000` encodes one share and one thousand loot. Use `--amount-raw`, `--shares-raw`, or `--loot-raw` only when intentionally passing exact base units. Tribute token `--amount` remains raw token units because ETH/ERC-20 decimals vary.

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
- tx hash when the action broadcast
- technical blocker when an action could not broadcast
- target contract/address
- value in ETH/wei

Raw JSON/calldata should be saved to a file or shown only on request.

## Proposal Intent Guardrail

Use `signal` only for text-only governance intent. If the operator asks to join, request shares, request loot, create a membership proposal, or make a tribute proposal, use an executable membership path. Use `tribute` / `join-dao` for token tribute. Use `mint-shares` for direct voting-share grants with no tribute transfer. A signal about shares does not issue shares.

Use `dao-meta` or `dao-record` for DAO profile, shared memory, hosted docs, and join-rule pointers.

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

Summon posts initial DAO profile metadata through Poster. Create and pin a shared community memory root before summon whenever possible, then include it in the initial metadata. Keep shared state simple: one versioned `community-state.md` file, not separate manifesto/charter/intent files.

```json
{
  "daoName": "Example DAO",
  "description": "Short public description",
  "communityMemoryURI": "ipfs://...",
  "proposalWorkspaceURI": "ipfs://.../proposals",
  "sharedStateURI": "ipfs://.../versions/0001/community-state.md"
}
```

For richer or changing rules, create a new IPFS version and use Poster/DAO records or `dao-meta` proposal ratification to point at the new CID:

- `daoProfile`: current profile and links.
- `communityMemory`: the shared IPFS root where agents and members coordinate.
- Poster DAO database records with `type` and `topicId`: onchain discussion, proposal notes, vote reasons, and state-version announcements.

Current DAOhaus Admin uses database-style Poster records. Signal proposals use the `daohaus.proposal.database` tag from the DAO/Safe and usually write `table: "signal"`. Direct member communication should use `daohaus.member.database`; `memory-post` does this by default and writes `table: "communityMemory"` unless another table is provided. The sender must be a DAO member for the current DAOhaus subgraph to index direct member posts.

Routine snapshots write local `dao-records.json` and `operating-context.json`, but those are per-agent working artifacts. Durable community memory should live under the shared IPFS root described in `SHARED_MEMORY.md`.

Create a starter memory root from:

```bash
cp -R templates/community-memory ./community-memory
```

Fill in `community-memory/manifest.json` and `community-memory/versions/0001/community-state.md`, pin the directory, then publish the root CID in summon metadata or with `dao-meta`:

```bash
node moloch-shared/scripts/moloch.mjs dao-meta \
  --dao 0xDAO \
  --name "DAO Name" \
  --community-memory-uri ipfs://... \
  --proposal-workspace-uri ipfs://.../proposals \
  --shared-state-uri ipfs://.../versions/0001/community-state.md \
  --send
```

IPFS is immutable. Do not edit an already-pinned shared state or proposal workspace in place. Create a new version directory, pin it, and publish the new CID.

Proposal workspaces should be created under the shared memory root before submission. Reuse an existing draft folder if one already exists. Each workspace should include proposal details, discussions, negotiations, action items, vote reasons, sources, status, and tx hashes after submission.

Use Poster for the onchain communication log:

```bash
node moloch-shared/scripts/moloch.mjs memory-post \
  --dao 0xDAO \
  --table communityMemory \
  --thread-id proposal-12-deliberation \
  --body "This draft should include a smaller initial share grant and a delivery checkpoint." \
  --send
```

For long posts, pin the content to IPFS and post the CID/hash through Poster with `--content-uri` and `--content-hash`.

Community memory records use a small `community-memory/v1` envelope. Keep `daoId`, `table`, `queryType`, `schema`, `type`, and `threadId` predictable so future UIs can group posts into threads. Use optional fields such as `proposalId`, `draftId`, `parentId`, `workspaceURI`, `stateURI`, and `contentURI` when they apply.

## Membership Context

Use member reads to understand who has shares/loot, delegation, and vote history:

```bash
node moloch-shared/scripts/moloch.mjs graph-members --dao 0xDAO --first 100
node moloch-shared/scripts/moloch.mjs graph-member --dao 0xDAO --member 0xMEMBER
```

`task-snapshot` also writes `membership-summary.json`.

## Operational Concerns

- Autonomous agents should send by default after live preflight. Do not wait for operator approval.
- The CLI requires `--send` to broadcast; this is a mechanical execution flag, not a human-confirmation requirement.
- Proposal builders default `submitProposal` `baalGas` to `0`. Baal ignores zero, while a low nonzero value can make processing fail with an out-of-gas style action failure. Use `--baal-gas` only when you know the required inner action gas. Use `--estimate-baal-gas` to opt in to DAOhaus-style estimation with a default `1.2x` buffer.
- `process` uses an explicit transaction gas limit because wallet estimation can miss inner proposal action gas. Default is the larger of `800000` or stored `baalGas + 400000`. Override with `--gas-limit`.
- Baal shares and loot have 18 decimals. Proposal commands use human units for share/loot quantities and expose raw overrides for low-level calls. This avoids accidental proposals that mint `10000` base units instead of `10000` full voting shares.
- Read direct contract state immediately before sending. Graph data can lag.
- Use Graph data for proposal metadata, votes, and the original indexed `proposalData`.
- Use Graph member data for membership, shares, loot, delegation, and vote history context.
- Use direct contract reads for permission, timing, and current threshold checks.
- Governance `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values.
- Use `graph-dao-history` for broad proposal history instead of looping over direct RPC reads.
- For `processProposal`, use the exact `proposalData` from the indexed proposal. Do not reconstruct it if Graph has the original payload.
- Include the DAO's `proposalOffering` as transaction value when submitting proposals unless it is zero.
- Verify the managed wallet has Base ETH for gas and the required DAO permissions or voting power.
- Record the tx hash and re-read state after confirmation.

## Current Limitations

- The shared script is intentionally Base-first.
- It covers common DAOhaus/Moloch V3 proposal flows, not every possible shaman or Safe interaction.
- Gas estimation is not a full replacement for simulation. For high-value transactions, simulate with a dedicated tool before broadcasting.
- Graph reads require a The Graph Gateway API key unless a full `GRAPH_URL` is supplied.
- The script stores no wallet state and does not manage key rotation, spending limits, or multisig custody.
