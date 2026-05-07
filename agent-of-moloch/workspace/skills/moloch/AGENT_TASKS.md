# Agent Task Suggestions

This repo supports DAO agents that run on a schedule. Use these task patterns to keep agents active without spamming proposals.

## Recommended Workflow

Split scheduled agent work into three layers:

1. **Cron snapshot**: a deterministic command gathers DAO state, Graph history, lifecycle summaries, process queue, and checkpoint files.
2. **Agent decision task**: the agent reads compact artifacts and decides one action.
3. **Action/postcondition task**: the agent builds or sends the transaction according to policy, then rereads state and updates logs.

This reduces tokens because scheduled prompts do not need to repeat every chain/Graph query. The agent can read cached artifacts first, then make targeted live reads only for actions it may take.

## Cron Snapshot

Use `task-snapshot` as the default scheduled data refresh.

```bash
node /data/custom/moloch-skills/moloch-shared/scripts/moloch.mjs task-snapshot \
  --dao 0xDAO \
  --first 100 \
  --out-dir /data/custom/moloch-skills/artifacts/0xDAO
```

Suggested cron cadence:

```cron
*/10 * * * * cd /data/custom/moloch-skills && node moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --first 100 --out-dir /data/custom/moloch-skills/artifacts/0xDAO >> /data/custom/moloch-skills/artifacts/0xDAO/cron.log 2>&1
```

The command writes:

- `direct-state.json`: direct contract state, if `RPC_URL` is configured.
- `graph-history.json`: DAOhaus indexed DAO/proposal history.
- `proposal-summary.json`: compact lifecycle summary for proposals.
- `membership-summary.json`: members, shares, loot, delegation, and vote counts.
- `dao-records.json`: latest profile, charter, and join-rules records.
- `operating-context.json`: compact current profile/charter/join-rules pointers and paths.
- `process-queue.json`: oldest ready-to-process proposals first.
- `checkpoint.json`: stable task checkpoint fields.

Agents should prefer these artifacts for routine review and use live commands only for final preflight.

Processing candidates are chain-verified when `RPC_URL` is configured. Do not drop candidates because indexed `passed` is false; direct `state(id) == Ready` is the source of truth for whether a proposal can be processed.

## Open Proposal Throttle

For the "no new proposals when 3 are open" rule, **open means proposals currently in voting**.

Do not count these as open for this throttle:

- unsponsored proposals
- proposals in grace period
- proposals ready for processing
- expired, cancelled, failed, passed, or processed proposals

Rule:

```text
If 3 or more proposals are currently in voting, do not create a new proposal.
Focus on voting, review, sponsorship, processing, or revision feedback instead.
```

Agents may still sponsor useful unsponsored proposals if doing so will not push the active voting count above the operator's intended limit.

## Task 1: Proposal Action Watcher

Purpose: find proposals that need sponsor, vote, process, cancel, or review action.

Suggested cadence:

- 30 minute voting/grace windows: every 10 minutes
- 4 hour voting/grace windows: every 30-60 minutes
- multi-day voting/grace windows: every 4-12 hours

Prompt:

```text
You are running the Proposal Action Watcher task for your DAO agent.

Your job is to inspect current DAO proposals and take the next appropriate governance action according to your mandate.

Steps:
1. Read the latest task snapshot artifacts:
   - direct-state.json
   - proposal-summary.json
   - process-queue.json
   - checkpoint.json
2. If artifacts are stale or missing, run task-snapshot.
3. Identify proposals that need action:
   - unsponsored proposals you may sponsor
   - voting proposals you have not voted on
   - proposals ready for processing
   - proposals that should be opposed, revised, cancelled, or left alone
4. Review passed proposals since your last checkpoint and update your DAO operating context.
5. For likely actions, perform targeted live preflight:
   - proposal-lifecycle for vote/process decisions
   - read-proposal before process/cancel
   - process-queue with a broad `--first` value, usually `100` or more
6. For each actionable proposal, produce a short memo:
   - proposal id
   - current status
   - relevant passed-proposal context
   - recommended action: sponsor, vote yes, vote no, abstain, process, cancel, or no action
   - reason
7. If the action is inside the agent mandate and harness auto-send policy, broadcast by default with `--send`.
8. For processing, the action is always in scope when `process-queue` says it is first and chain-ready. Do not block processing because of proposal category, value, membership, shares, loot, payments, settings, or mandate preference.
9. Build unsigned only when policy blocks non-processing actions, chain preflight fails, exact proposalData is unavailable/mismatched, signer/gas is unavailable, or the task explicitly asks for dry-run/review mode.
10. After any send, reread state and append an action log entry.

Priority order:
1. Vote on proposals in voting before their voting period ends.
2. Process the first item from `process-queue`; then re-run the queue before processing another proposal.
3. Sponsor good unsponsored proposals when appropriate.
4. Flag conflicting or unclear proposals for revision.
5. Do not draft new proposals in this task.
```

## Task 2: Proposal Generation Task

Purpose: decide whether the agent should create one new proposal according to its mandate.

Suggested cadence:

- 30 minute voting/grace windows: every 45-60 minutes
- 4 hour voting/grace windows: every 6-12 hours
- multi-day voting/grace windows: daily or every few days

Prompt:

```text
You are running the Proposal Generation task for your DAO agent.

Your job is to decide whether your agent should create a new proposal according to its mandate.

Steps:
1. Read the latest task snapshot artifacts.
2. If artifacts are stale or missing, run task-snapshot.
3. Count proposals currently in voting from proposal-summary.json.
4. If there are 3 or more proposals currently in voting, do not create a new proposal. Summarize what needs to resolve first.
5. Review passed proposals since your last run and update your DAO operating context.
6. Check your mandate checklist.
7. If fewer than 3 proposals are currently in voting, choose at most one:
   - draft a signal proposal
   - draft a tribute/join/mint-shares/reward proposal
   - draft a DAO settings proposal
   - no action
8. New proposals must:
   - reference relevant passed proposals
   - avoid conflict with current DAO rules unless explicitly framed as an amendment
   - include a clear title, description, expected outcome, and success criteria
   - explain why now
9. Broadcast by default with `--send` if the proposal is inside the agent mandate and harness auto-send policy. Save unsigned transaction JSON only for dry-run/review mode or when policy blocks broadcast.
```

## Artifacts, Logs, And Checkpoints

Each agent should maintain:

- last proposal id reviewed
- last passed proposal id incorporated into context
- current DAO operating context
- currently voting proposal count
- pending action list
- mandate checklist

Passed proposals should update the agent's operating context. Failed or rejected proposals should update the agent's understanding of DAO preferences.

Recommended artifact layout:

```text
/data/custom/moloch-skills/artifacts/<dao>/
  direct-state.json
  graph-history.json
  proposal-summary.json
  membership-summary.json
  dao-records.json
  operating-context.json
  process-queue.json
  checkpoint.json
  cron.log
  actions/
    <timestamp>-<agent>-<action>.json
  drafts/
    <timestamp>-<agent>-proposal.json
  memos/
    <timestamp>-<agent>-memo.md
```

Recommended `checkpoint.json` fields:

```json
{
  "dao": "0x...",
  "updatedAt": "2026-05-07T00:00:00.000Z",
  "lastProcessedProposalId": null,
  "currentOperatingContext": null,
  "openProposalCount": 0,
  "pendingActionList": [],
  "mandateChecklistStatus": null,
  "lastGraphProposalIdSeen": 0,
  "lastPassedProposalIdIncorporated": null,
  "votingCount": 0,
  "needsProcessingCount": 0
}
```

Recommended action log fields:

```json
{
  "agent": "agent-name",
  "action": "vote",
  "dao": "0x...",
  "proposalId": "12",
  "decision": "yes",
  "txHash": "0x...",
  "preState": {},
  "postState": {},
  "memoPath": "memos/..."
}
```

## Useful Commands

Read direct state:

```bash
node moloch-shared/scripts/moloch.mjs read-dao --dao 0xDAO
```

Read broad indexed history:

```bash
node moloch-shared/scripts/moloch.mjs graph-dao-history --dao 0xDAO --first 100
```

Write scheduled artifacts:

```bash
node moloch-shared/scripts/moloch.mjs task-snapshot --dao 0xDAO --first 100 --out-dir /data/custom/moloch-skills/artifacts/0xDAO
```

Read one proposal:

```bash
node moloch-shared/scripts/moloch.mjs graph-proposal --dao 0xDAO --proposal 1
```

Derive lifecycle and processing queue:

```bash
node moloch-shared/scripts/moloch.mjs proposal-lifecycle --dao 0xDAO --proposal 1
node moloch-shared/scripts/moloch.mjs process-queue --dao 0xDAO --first 100
```
