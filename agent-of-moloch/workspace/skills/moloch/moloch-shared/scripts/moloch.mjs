#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  createPublicClient,
  createWalletClient,
  decodeAbiParameters,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  http,
  parseAbiParameters,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { generatePrivateKey } from 'viem/accounts';
import { base } from 'viem/chains';
import { request, gql } from 'graphql-request';

const ZERO = '0x0000000000000000000000000000000000000000';
const BASE_CHAIN_ID = 8453;
const SUMMONER = '0x97Aaa5be8B38795245f1c38A883B44cccdfB3E11';
const POSTER = '0x000000000000cd17345801aa8147b8D3950260FF';
const DAOHAUS_BASE_SUBGRAPH_ID = '7yh4eHJ4qpHEiLPAk9BXhL5YgYrTrRE6gWy8x4oHyAqW';
const POSTER_TAG_DAO_DB = 'daohaus.proposal.database';
const POSTER_TAG_SUMMONER = 'daohaus.summoner.daoProfile';

const BAAL_ABI = [
  { type: 'function', name: 'submitProposal', stateMutability: 'payable', inputs: [{ name: 'proposalData', type: 'bytes' }, { name: 'expiration', type: 'uint32' }, { name: 'baalGas', type: 'uint256' }, { name: 'details', type: 'string' }], outputs: [] },
  { type: 'function', name: 'sponsorProposal', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }], outputs: [] },
  { type: 'function', name: 'submitVote', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }, { name: 'approved', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'processProposal', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }, { name: 'proposalData', type: 'bytes' }], outputs: [] },
  { type: 'function', name: 'cancelProposal', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint32' }], outputs: [] },
  { type: 'function', name: 'setGovernanceConfig', stateMutability: 'nonpayable', inputs: [{ name: '_governanceConfig', type: 'bytes' }], outputs: [] },
  { type: 'function', name: 'setAdminConfig', stateMutability: 'nonpayable', inputs: [{ name: 'pauseShares', type: 'bool' }, { name: 'pauseLoot', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'setShamans', stateMutability: 'nonpayable', inputs: [{ name: '_shamans', type: 'address[]' }, { name: '_permissions', type: 'uint256[]' }], outputs: [] },
  { type: 'function', name: 'executeAsBaal', stateMutability: 'nonpayable', inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }, { name: '_data', type: 'bytes' }], outputs: [] },
  { type: 'function', name: 'proposalCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint32' }] },
  { type: 'function', name: 'proposalOffering', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'sponsorThreshold', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'latestSponsoredProposalId', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint32' }] },
  { type: 'function', name: 'getProposalStatus', stateMutability: 'view', inputs: [{ name: 'id', type: 'uint32' }], outputs: [{ type: 'bool[4]' }] },
  { type: 'function', name: 'memberVoted', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint32' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'proposals', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ name: 'id', type: 'uint32' }, { name: 'prevProposalId', type: 'uint32' }, { name: 'votingStarts', type: 'uint32' }, { name: 'votingEnds', type: 'uint32' }, { name: 'graceEnds', type: 'uint32' }, { name: 'expiration', type: 'uint32' }, { name: 'baalGas', type: 'uint256' }, { name: 'yesVotes', type: 'uint256' }, { name: 'noVotes', type: 'uint256' }, { name: 'maxTotalSharesAndLootAtVote', type: 'uint256' }, { name: 'maxTotalSharesAtSponsor', type: 'uint256' }, { name: 'sponsor', type: 'address' }, { name: 'proposalDataHash', type: 'bytes32' }] },
];

const POSTER_ABI = [
  { type: 'function', name: 'post', stateMutability: 'nonpayable', inputs: [{ name: 'content', type: 'string' }, { name: 'tag', type: 'string' }], outputs: [] },
];

const SUMMONER_ABI = [
  { type: 'function', name: 'summonBaalFromReferrer', stateMutability: 'nonpayable', inputs: [{ name: '_safeAddr', type: 'address' }, { name: '_forwarderAddr', type: 'address' }, { name: '_saltNonce', type: 'uint256' }, { name: 'initializationMintParams', type: 'bytes' }, { name: 'initializationTokenParams', type: 'bytes' }, { name: 'postInitializationActions', type: 'bytes[]' }], outputs: [] },
];

const MULTISEND_ABI = [
  { type: 'function', name: 'multiSend', stateMutability: 'payable', inputs: [{ name: 'transactions', type: 'bytes' }], outputs: [] },
];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

function has(name) {
  return process.argv.includes(`--${name}`);
}

function boolArg(name, fallback = false) {
  const value = arg(name);
  if (value == null) return fallback;
  return value === 'true' || value === '1' || value === 'yes';
}

function jsonFile(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function stringify(value) {
  return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2);
}

function tx(to, data, value = 0n) {
  return { chainId: Number(process.env.CHAIN_ID || BASE_CHAIN_ID), to, value: value.toString(), data };
}

function encodeValues(types, values) {
  return encodeAbiParameters(parseAbiParameters(types.join(',')), values);
}

function rawPercent(name, value) {
  const normalized = String(value).trim().replace(/%$/, '');
  if (normalized.includes('.')) {
    throw new Error(`${name} must be a whole-number percent from 0 to 100. Baal does not accept decimal or 18-decimal percentages.`);
  }
  const percent = BigInt(normalized);
  if (percent < 0n || percent > 100n) {
    throw new Error(`${name} must be a raw percent from 0 to 100, not 18-decimal fixed point.`);
  }
  return percent;
}

function encodeMultiSend(txs) {
  const packed = txs.map((t) => {
    const op = Number(t.operation ?? 0).toString(16).padStart(2, '0');
    const to = t.to.toLowerCase().replace(/^0x/, '').padStart(40, '0');
    const value = BigInt(t.value ?? 0).toString(16).padStart(64, '0');
    const data = (t.data ?? '0x').replace(/^0x/, '');
    const len = (data.length / 2).toString(16).padStart(64, '0');
    return `${op}${to}${value}${len}${data}`;
  }).join('');
  return `0x${packed}`;
}

function decodeMultiSendBytes(bytes) {
  const clean = bytes.replace(/^0x/, '');
  const txs = [];
  let i = 0;
  while (i < clean.length) {
    const operation = Number.parseInt(clean.slice(i, i + 2), 16);
    i += 2;
    const to = `0x${clean.slice(i, i + 40)}`;
    i += 40;
    const value = BigInt(`0x${clean.slice(i, i + 64) || '0'}`);
    i += 64;
    const dataLength = Number(BigInt(`0x${clean.slice(i, i + 64) || '0'}`));
    i += 64;
    const data = `0x${clean.slice(i, i + dataLength * 2)}`;
    i += dataLength * 2;
    txs.push({ operation, to, value: value.toString(), data });
  }
  return txs;
}

function encodeMultiAction(actions) {
  return encodeFunctionData({ abi: MULTISEND_ABI, functionName: 'multiSend', args: [encodeMultiSend(actions)] });
}

function details({ title, description, link, proposalType }) {
  return JSON.stringify({
    title,
    description,
    contentURI: link || '',
    contentURIType: link ? 'url' : '',
    proposalType,
  });
}

function graphUrl() {
  const key = process.env.GRAPH_API_KEY || arg('graph-key');
  const url = process.env.GRAPH_URL || arg('graph-url');
  if (url) return url;
  if (!key) throw new Error('Set GRAPH_API_KEY, pass --graph-key, or pass --graph-url');
  return `https://gateway-arbitrum.network.thegraph.com/api/${key}/subgraphs/id/${DAOHAUS_BASE_SUBGRAPH_ID}`;
}

const DAO_FIELDS = `
  id name createdAt createdBy txHash safeAddress
  lootPaused sharesPaused gracePeriod votingPeriod proposalOffering
  quorumPercent sponsorThreshold minRetentionPercent
  shareTokenName shareTokenSymbol sharesAddress lootTokenName lootTokenSymbol lootAddress
  totalShares totalLoot latestSponsoredProposalId proposalCount activeMemberCount
  shamen: shaman(orderBy: createdAt, orderDirection: desc) {
    id shamanAddress permissions
  }
  vaults(where: { active: true }) {
    id name safeAddress ragequittable active
  }
`;

const PROPOSAL_FIELDS = `
  id createdAt createdBy proposedBy txHash proposalId prevProposalId
  proposalDataHash proposalData actionGasEstimate details title description
  proposalType contentURI contentURIType sponsorTxHash sponsored selfSponsor sponsor sponsorTxAt
  votingStarts votingEnds graceEnds expiration cancelled cancelledTxHash
  yesBalance noBalance yesVotes noVotes processed passed actionFailed processTxHash
  proposalOffering
  sponsorMembership { memberAddress shares delegateShares }
  dao { id totalShares quorumPercent minRetentionPercent }
  votes { id txHash createdAt approved balance member { memberAddress } }
`;

async function graphDao(dao) {
  return request(graphUrl(), gql`query dao($daoid: String!) { dao(id: $daoid) { ${DAO_FIELDS} } }`, { daoid: dao.toLowerCase() });
}

async function graphProposal(dao, proposal) {
  const proposalid = `${dao.toLowerCase()}-proposal-${proposal}`;
  return request(graphUrl(), gql`query proposal($proposalid: String!) { proposal(id: $proposalid) { ${PROPOSAL_FIELDS} } }`, { proposalid });
}

async function graphProposals(dao) {
  return request(graphUrl(), gql`query proposals($daoid: String!, $first: Int!, $skip: Int!) {
    proposals(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc, where: { dao: $daoid }) {
      ${PROPOSAL_FIELDS}
    }
  }`, { daoid: dao.toLowerCase(), first: Number(arg('first', 20)), skip: Number(arg('skip', 0)) });
}

function proposalTx({ dao, actions, title, description, link, proposalType, expiration = 0, baalGas = 0, value = 0n }) {
  const proposalData = encodeMultiAction(actions);
  const data = encodeFunctionData({
    abi: BAAL_ABI,
    functionName: 'submitProposal',
    args: [proposalData, Number(expiration), BigInt(baalGas), details({ title, description, link, proposalType })],
  });
  return { ...tx(dao, data, value), proposalData };
}

function requireDao() {
  const dao = arg('dao');
  if (!dao) throw new Error('Missing --dao 0x...');
  return dao;
}

function client() {
  const url = process.env.RPC_URL || arg('rpc');
  if (!url) throw new Error('Set RPC_URL or pass --rpc');
  return createPublicClient({ chain: base, transport: http(url) });
}

async function sendIfRequested(unsigned) {
  if (!has('send')) return unsigned;
  if (!process.env.PRIVATE_KEY) throw new Error('Set PRIVATE_KEY to send');
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const wallet = createWalletClient({ account, chain: base, transport: http(process.env.RPC_URL || arg('rpc')) });
  const hash = await wallet.sendTransaction({ account, to: unsigned.to, value: BigInt(unsigned.value || 0), data: unsigned.data });
  return { hash, from: account.address, unsigned };
}

async function main() {
  const command = process.argv[2];
  if (!command || command === '--help') {
    console.log('Commands: new-account, read-dao, read-proposal, graph-dao, graph-proposal, graph-proposals, details, decode-proposal-data, decode-submit-proposal, signal, gov-settings, token-settings, sponsor, vote, process, cancel, summon. Add --send to broadcast write txs.');
    return;
  }

  if (command === 'new-account') {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    console.log(stringify({ address: account.address, privateKey }));
    return;
  }

  if (command === 'details') {
    console.log(details({
      title: arg('title', ''),
      description: arg('description', ''),
      link: arg('link', ''),
      proposalType: arg('proposal-type', 'MULTICALL'),
    }));
    return;
  }

  if (command === 'decode-proposal-data') {
    const data = arg('data') || arg('proposal-data');
    if (!data) throw new Error('Missing --data 0x...');
    const decoded = decodeFunctionData({ abi: MULTISEND_ABI, data });
    console.log(stringify({ functionName: decoded.functionName, actions: decodeMultiSendBytes(decoded.args[0]) }));
    return;
  }

  if (command === 'decode-submit-proposal') {
    const data = arg('data');
    if (!data) throw new Error('Missing --data 0x...');
    const decoded = decodeFunctionData({ abi: BAAL_ABI, data });
    const [proposalData, expiration, baalGas, rawDetails] = decoded.args;
    let parsedDetails = rawDetails;
    try { parsedDetails = JSON.parse(rawDetails); } catch {}
    let actions = [];
    try {
      const multi = decodeFunctionData({ abi: MULTISEND_ABI, data: proposalData });
      actions = decodeMultiSendBytes(multi.args[0]);
    } catch {}
    console.log(stringify({ functionName: decoded.functionName, proposalData, expiration, baalGas, details: parsedDetails, actions }));
    return;
  }

  if (command === 'graph-dao') {
    console.log(stringify(await graphDao(requireDao())));
    return;
  }

  if (command === 'graph-proposal') {
    console.log(stringify(await graphProposal(requireDao(), Number(arg('proposal')))));
    return;
  }

  if (command === 'graph-proposals') {
    console.log(stringify(await graphProposals(requireDao())));
    return;
  }

  if (command === 'read-dao') {
    const dao = requireDao();
    const c = client();
    const [proposalCount, proposalOffering, sponsorThreshold, latestSponsoredProposalId] = await Promise.all([
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposalCount' }),
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposalOffering' }),
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'sponsorThreshold' }),
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'latestSponsoredProposalId' }),
    ]);
    console.log(stringify({ dao, proposalCount, proposalOffering, sponsorThreshold, latestSponsoredProposalId }));
    return;
  }

  if (command === 'read-proposal') {
    const dao = requireDao();
    const id = Number(arg('proposal'));
    const c = client();
    const [raw, status] = await Promise.all([
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'proposals', args: [BigInt(id)] }),
      c.readContract({ address: dao, abi: BAAL_ABI, functionName: 'getProposalStatus', args: [id] }),
    ]);
    console.log(stringify({ dao, proposal: id, raw, status }));
    return;
  }

  let out;
  if (command === 'signal') {
    const dao = requireDao();
    const title = arg('title');
    const description = arg('description', '');
    const link = arg('link', '');
    if (!title) throw new Error('Missing --title');
    const postData = encodeFunctionData({ abi: POSTER_ABI, functionName: 'post', args: [JSON.stringify({ daoId: dao, table: 'signal', queryType: 'list', title, description, link }), POSTER_TAG_DAO_DB] });
    out = proposalTx({ dao, title, description, link, proposalType: 'SIGNAL', expiration: Number(arg('expiration', 0)), baalGas: BigInt(arg('baal-gas', 0)), value: BigInt(arg('value', 0)), actions: [{ to: POSTER, value: 0, data: postData, operation: 0 }] });
  } else if (command === 'gov-settings') {
    const dao = requireDao();
    const p = jsonFile(arg('params'));
    const inner = encodeValues(['uint32', 'uint32', 'uint256', 'uint256', 'uint256', 'uint256'], [p.votingPeriodInSeconds, p.gracePeriodInSeconds, BigInt(p.newOffering), rawPercent('quorum', p.quorum), BigInt(p.sponsorThreshold), rawPercent('minRetention', p.minRetention)]);
    const action = encodeFunctionData({ abi: BAAL_ABI, functionName: 'setGovernanceConfig', args: [inner] });
    out = proposalTx({ dao, title: p.title, description: p.description || '', link: p.link || '', proposalType: 'UPDATE_GOV_SETTINGS', expiration: p.expiration || 0, baalGas: BigInt(p.baalGas || 0), value: BigInt(p.value || 0), actions: [{ to: dao, value: 0, data: action, operation: 0 }] });
  } else if (command === 'token-settings') {
    const dao = requireDao();
    const title = arg('title', 'Update token settings');
    const description = arg('description', '');
    const action = encodeFunctionData({ abi: BAAL_ABI, functionName: 'setAdminConfig', args: [boolArg('pause-shares'), boolArg('pause-loot')] });
    out = proposalTx({ dao, title, description, link: arg('link', ''), proposalType: 'TOKEN_SETTINGS', expiration: Number(arg('expiration', 0)), baalGas: BigInt(arg('baal-gas', 0)), value: BigInt(arg('value', 0)), actions: [{ to: dao, value: 0, data: action, operation: 0 }] });
  } else if (['sponsor', 'vote', 'process', 'cancel'].includes(command)) {
    const dao = requireDao();
    const id = Number(arg('proposal'));
    const functionName = command === 'sponsor' ? 'sponsorProposal' : command === 'vote' ? 'submitVote' : command === 'process' ? 'processProposal' : 'cancelProposal';
    const args = command === 'vote' ? [id, boolArg('approved')] : command === 'process' ? [id, arg('proposal-data')] : [id];
    out = tx(dao, encodeFunctionData({ abi: BAAL_ABI, functionName, args }));
  } else if (command === 'summon') {
    const p = jsonFile(arg('params'));
    const mint = encodeValues(['address[]', 'uint256[]', 'uint256[]'], [p.memberAddresses, p.memberShares.map(BigInt), p.memberLoot.map(BigInt)]);
    const tokens = encodeValues(['string', 'string', 'string', 'string', 'bool', 'bool'], [p.tokenName, p.tokenSymbol, p.lootTokenName, p.lootTokenSymbol, !!p.votingTransferable, !!p.nvTransferable]);
    const gov = encodeValues(['uint32', 'uint32', 'uint256', 'uint256', 'uint256', 'uint256'], [p.votingPeriodInSeconds, p.gracePeriodInSeconds, BigInt(p.newOffering), rawPercent('quorum', p.quorum), BigInt(p.sponsorThreshold), rawPercent('minRetention', p.minRetention)]);
    const govTx = encodeFunctionData({ abi: BAAL_ABI, functionName: 'setGovernanceConfig', args: [gov] });
    const shamanTx = encodeFunctionData({ abi: BAAL_ABI, functionName: 'setShamans', args: [p.shamanAddresses || [], (p.shamanPermissions || []).map(BigInt)] });
    const metadataPost = encodeFunctionData({ abi: POSTER_ABI, functionName: 'post', args: [JSON.stringify({ name: p.daoName }), POSTER_TAG_SUMMONER] });
    const metadataTx = encodeFunctionData({ abi: BAAL_ABI, functionName: 'executeAsBaal', args: [POSTER, 0n, metadataPost] });
    const salt = p.saltNonce || BigInt(`0x${crypto.randomBytes(16).toString('hex')}`);
    out = tx(SUMMONER, encodeFunctionData({ abi: SUMMONER_ABI, functionName: 'summonBaalFromReferrer', args: [p.safeAddress || ZERO, ZERO, BigInt(salt), mint, tokens, [govTx, shamanTx, metadataTx]] }));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  console.log(stringify(await sendIfRequested(out)));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
