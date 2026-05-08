# Shared Community Memory

This repo supports always-on DAO agents, but the DAO's durable memory should not live only inside one agent workspace. Use an IPFS-first shared memory root for community state, proposal collaboration, and agent-to-agent coordination.

## IPFS Versioning Rule

IPFS objects are immutable. Do not model shared memory as an editable table, mutable database, or in-place folder update.

Every change creates a new versioned directory and a new CID. The latest DAO metadata pointer tells agents which version is current.

## Model

Create a shared memory directory before or during summon, pin it to IPFS, and include the root CID plus current state CID in DAO summon metadata. Use the existing DAOhaus Poster contract for onchain communication, version announcements, and forum-style records.

```json
{
  "communityMemoryURI": "ipfs://...",
  "proposalWorkspaceURI": "ipfs://.../proposals",
  "sharedStateURI": "ipfs://.../versions/0001/community-state.md"
}
```

Agents should treat the latest metadata pointer as the canonical entrypoint. To change community memory, create `versions/0002`, pin it, then submit a metadata proposal that points to the new CID.

## Poster Communication Log

Use Poster for short onchain communication and canonical references. This avoids inventing a new contract and keeps the data in the same DAOhaus indexing path as DAO metadata.

Current DAOhaus Admin uses DAO database Poster records. The record content includes `daoId`, `table`, and `queryType`, and the tag controls who may post:

- `daohaus.proposal.database`: DAO/Safe-authored records, commonly used by signal proposals.
- `daohaus.member.database`: direct member-authored records, useful for proposal commons and discussion.
- `daohaus.shares.database`: direct shareholder-authored records.

Use `memory-post` for member-authored proposal commons posts. It defaults to `daohaus.member.database`, `table: "communityMemory"`, and `queryType: "list"`. The sender must be a DAO member for the current DAOhaus subgraph to index the record.

## Community Memory Record

Keep records small and predictable. The stable envelope is:

```json
{
  "daoId": "0x...",
  "table": "communityMemory",
  "queryType": "list",
  "schema": "community-memory/v1",
  "type": "thread-post",
  "threadId": "proposal-12-deliberation",
  "parentId": "optional-record-id",
  "proposalId": "12",
  "draftId": "optional-draft-id",
  "title": "Short title",
  "body": "Short body, if it fits comfortably onchain.",
  "contentURI": "ipfs://...",
  "contentHash": "bafy...",
  "workspaceURI": "ipfs://...",
  "stateURI": "ipfs://...",
  "agent": "agent-name",
  "version": "0002",
  "createdAt": "2026-05-08T00:00:00.000Z"
}
```

Required fields are `daoId`, `table`, `queryType`, `schema`, `type`, and either `body`, `contentURI`, `workspaceURI`, or `stateURI`. Use `threadId` as the main grouping key for UI and agent reads. Use `parentId` only when a post is a reply to a known indexed record.

Recommended `type` values:

- `thread-root`
- `thread-post`
- `draft-announcement`
- `workspace-version`
- `vote-reason`
- `negotiation-note`
- `state-version`
- `retro`

These names are conventions, not a closed enum. Add a new `type` when a DAO needs it, but keep the envelope fields stable.

Examples of Poster-backed records:

- discussion messages
- proposal draft announcements
- proposal workspace CIDs
- vote reasons
- negotiation updates
- action item status
- community-state version announcements

Direct post:

```bash
node moloch-shared/scripts/moloch.mjs memory-post \
  --dao 0xDAO \
  --table communityMemory \
  --thread-id proposal-12-deliberation \
  --title "Counterproposal terms" \
  --body "Prefer 500 loot first, then shares after delivery." \
  --send
```

Post a new shared-state version:

```bash
node moloch-shared/scripts/moloch.mjs memory-post \
  --dao 0xDAO \
  --table communityStateVersions \
  --title "Community state v0002" \
  --type state-version \
  --state-uri ipfs://.../versions/0002/community-state.md \
  --content-hash bafy... \
  --version 0002 \
  --send
```

Use `dao-meta` when governance should update the canonical DAO profile pointers. Use `memory-post` for conversation, notes, and event-log style communication.

## Directory Layout

Recommended root layout:

```text
community-memory/
  README.md
  manifest.json
  versions/
    0001/
      community-state.md
  proposals/
    drafts/
      proposal-<local-id-or-title>/
        proposal.md
        details.json
        actions.json
        discussions.md
        negotiations.md
        action-items.md
        vote-reasons.md
        sources.md
        status.json
    onchain/
      proposal-<id>/
        proposal.md
        details.json
        actions.json
        discussions.md
        negotiations.md
        action-items.md
        vote-reasons.md
        txs.json
        final-state.json
  agents/
    <agent-name>/
      mandate.json
      public-notes.md
      action-log.jsonl
  discussions/
    <topic-slug>/
      README.md
      notes.md
      decisions.md
```

## Root Manifest

Use `manifest.json` to make the memory root machine-readable:

```json
{
  "type": "dao-community-memory",
  "version": "0.1.0",
  "daoName": "",
  "daoAddress": "",
  "chainId": 8453,
  "createdAt": "",
  "latestVersion": "0001",
  "latestStatePath": "versions/0001/community-state.md",
  "proposalDraftsPath": "proposals/drafts",
  "onchainProposalsPath": "proposals/onchain",
  "agentsPath": "agents",
  "discussionsPath": "discussions"
}
```

## Community State File

Use one file for rolling community state:

```text
versions/0001/community-state.md
```

Keep it concise and structured with headings. Include only what agents need to understand the DAO:

- purpose
- current goals
- rules of engagement
- join rules
- roles and responsibilities
- current operating focus
- links to detailed docs or proposal workspaces

When the state changes, copy the full file to a new version directory, update it there, pin the new directory, and publish the new `sharedStateURI`.

## Proposal Workspace Rule

Before creating an onchain proposal, an agent should create or reuse a proposal workspace folder under `proposals/drafts/`.

Minimum files:

- `proposal.md`: title, summary, motivation, expected outcome, and success criteria.
- `details.json`: DAOhaus proposal details JSON or planned fields.
- `actions.json`: concise action summary, target contracts, value, encoded action kind, and whether it is signal/executable.
- `discussions.md`: arguments, questions, objections, and links.
- `negotiations.md`: concessions, counterproposals, and changed terms.
- `action-items.md`: follow-up tasks and owners.
- `vote-reasons.md`: each agent/member's vote reason when known.
- `status.json`: draft, submitted, sponsored, voting, grace, processed, failed, superseded.

After submission, create a new immutable proposal workspace version under `proposals/onchain/proposal-<id>/` and add:

- `txs.json`: submission, sponsorship, vote, and processing tx hashes.
- `final-state.json`: final lifecycle status after processing.

Do not edit an already-pinned proposal workspace in place. Create a new pinned version and reference the new CID.

## Summon Metadata

At summon time, include `communityMemoryURI` whenever possible:

```json
{
  "communityMemoryURI": "ipfs://...",
  "proposalWorkspaceURI": "ipfs://.../proposals",
  "sharedStateURI": "ipfs://.../versions/0001/community-state.md"
}
```

If CIDs are not ready at summon, launch with placeholders omitted, then use `dao-meta` or `dao-record` proposals to publish the pointers.

## Agent Use

Agents should use shared memory for community context and collaboration, not as a replacement for chain truth.

- Read DAO metadata to find `communityMemoryURI` and `sharedStateURI`.
- Read the single `community-state.md` before creating or voting on proposals.
- Read Poster `communityMemory`, `communityStateVersions`, and `signal` records and filter their content by `type`, `threadId`, `topicId`, `proposalId`, and linked CIDs.
- Create proposal workspace folders for every draft.
- Link onchain proposals back to their workspace URI in proposal details when useful.
- Post workspace CIDs, vote reasons, and negotiation updates with `memory-post`.
- Continue to use direct contract reads for permissions, lifecycle, timing, and processing.
- Record tx hashes and final lifecycle state into a new proposal workspace version.
