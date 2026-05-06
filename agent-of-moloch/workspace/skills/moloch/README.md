# Moloch Agent Skills

This directory contains Codex skills and a shared script for interacting with DAOhaus/Moloch V3/Baal DAOs on Base.

## Skills

- `moloch-shared`: shared wallet, RPC, Graph, encoding, decoding, and transaction helpers.
- `moloch-summon`: summon a new Moloch V3/Baal DAO.
- `moloch-proposals`: create signal, governance settings, token/admin settings, and custom proposals.
- `moloch-proposal-actions`: sponsor, vote, process, and cancel proposals.
- `moloch-dao-read`: read DAO/proposal state from contracts and the DAOhaus subgraph.
- `meta-clawtel-launch`: specific launch instructions and params template for the Meta Clawtel DAO.

## Setup

Install script dependencies:

```bash
cd moloch-shared
npm install
node scripts/moloch.mjs --help
```

## Environment

Required for direct contract reads and sending transactions:

```bash
export RPC_URL="https://mainnet.base.org"
```

For a more reliable Base RPC, use Alchemy or another provider:

```bash
export RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
```

Required only when broadcasting transactions:

```bash
export PRIVATE_KEY="0x..."
```

Required for DAOhaus indexed reads:

```bash
export GRAPH_API_KEY="..."
```

Optional:

```bash
export CHAIN_ID="8453"
export GRAPH_URL="https://gateway-arbitrum.network.thegraph.com/api/<key>/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

Notes:

- `CHAIN_ID` defaults to `8453` for Base.
- `GRAPH_URL` can be used instead of `GRAPH_API_KEY`.
- `PRIVATE_KEY` is never needed for building unsigned transaction JSON.
- `GRAPH_URL` and `GRAPH_API_KEY` are read-only indexing inputs. They cannot submit transactions.
- Do not commit `.env` files, private keys, mnemonics, or raw signer credentials.
- For production use, prefer a pre-provisioned managed wallet or custody system. Local key generation is mainly for fresh operator or test wallets.

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
```

Build proposal details or decode proposal calldata:

```bash
node moloch-shared/scripts/moloch.mjs details --title "Title" --description "Body" --proposal-type SIGNAL
node moloch-shared/scripts/moloch.mjs decode-submit-proposal --data 0xFULL_CALLDATA
node moloch-shared/scripts/moloch.mjs decode-proposal-data --data 0xINNER_PROPOSAL_DATA
```

Build unsigned transactions:

```bash
node moloch-shared/scripts/moloch.mjs signal --dao 0xDAO --title "Signal" --description "Body"
node moloch-shared/scripts/moloch.mjs gov-settings --dao 0xDAO --params params.json
node moloch-shared/scripts/moloch.mjs token-settings --dao 0xDAO --pause-shares false --pause-loot false
node moloch-shared/scripts/moloch.mjs sponsor --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true
node moloch-shared/scripts/moloch.mjs process --dao 0xDAO --proposal 1 --proposal-data 0x...
node moloch-shared/scripts/moloch.mjs summon --params summon.json
```

Broadcast only after review:

```bash
node moloch-shared/scripts/moloch.mjs vote --dao 0xDAO --proposal 1 --approved true --send
```

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
export GRAPH_URL="https://gateway-arbitrum.network.thegraph.com/api/YOUR_GRAPH_KEY/subgraphs/id/7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW"
```

## Operational Concerns

- Build first, send second. Every write command returns unsigned tx JSON unless `--send` is provided.
- Read direct contract state immediately before sending. Graph data can lag.
- Use Graph data for proposal metadata, votes, and the original indexed `proposalData`.
- Use direct contract reads for permission, timing, and current threshold checks.
- Governance `quorum` and `minRetention` are raw whole-number percentages from `0` to `100`, not 18-decimal fixed-point values.
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
