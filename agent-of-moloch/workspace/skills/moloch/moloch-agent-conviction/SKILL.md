---
name: moloch-agent-conviction
description: Define and apply an agent governance mandate for DAOhaus/Moloch DAOs. Use when bootstrapping an agent's values, voting policy, proposal evaluation rubric, abstain/escalation rules, or durable conviction profile that guides signal proposals, sponsorship, voting, and charter alignment.
---

# Moloch Agent Conviction

Use this skill to create or apply an agent's governance mandate. "Conviction" is the shorthand, but the operating artifact should be called a **governance mandate** or **voting policy** when communicating with humans.

This skill does not replace transaction safety checks. Use `../moloch-dao-read` before evaluating proposals and `../moloch-proposal-actions` before any vote/sponsor/process action.
For the general voting workflow, also use `../VOTE_DECISION_FLOW.md`.

## Bootstrap Workflow

1. Create a conviction profile from `assets/conviction-profile.template.json`.
2. Fill in identity, values, voting rules, abstain rules, and escalation rules.
3. Store the profile wherever the agent harness expects persistent memory.
4. If the DAO wants an auditable mandate, ratify it with a signal proposal or post a charter/mandate pointer through Poster.
5. Before each vote, load the latest conviction profile and current proposal state.

## Required Profile Sections

- `identity`: agent name, DAO, address, mandate version.
- `values`: ranked principles the agent should optimize for.
- `defaultVotePolicy`: when to vote yes, no, or abstain.
- `proposalRubric`: scoring categories and minimum thresholds.
- `hardNoRules`: conditions that force a no vote.
- `abstainRules`: conditions that force abstention or human review.
- `sponsorshipPolicy`: when the agent may sponsor a proposal.
- `executionPolicy`: when the agent may process proposals.
- `escalationPolicy`: when to ask for human confirmation.
- `auditLog`: how to record reasoning and transaction hashes.

## Vote Evaluation

For every proposal, produce a short vote memo before building a vote transaction:

```text
Proposal:
Relevant mandate version:
Current proposal state:
Scores:
Hard-no checks:
Abstain/escalation checks:
Recommended action:
Reason:
Confidence:
```

Only broadcast a vote transaction if the memo reaches a clear recommendation under the mandate and live chain preflight passes. If the agent has auto-send authority from its harness or task policy, use `--send` without waiting for operator confirmation. If the memo is unclear or an escalation rule triggers, do not broadcast.

## Default Decision Rules

Use these defaults unless the conviction profile overrides them:

- Vote `yes` when the proposal advances the DAO's stated values, has bounded risk, and clears rubric thresholds.
- Vote `no` when it violates a hard-no rule, weakens DAO integrity, creates unbounded obligations, or conflicts with the charter.
- Abstain when facts are missing, conflicts of interest are present, proposal text is ambiguous, or the mandate does not cover the decision.
- Sponsor only when the proposal is legible, within scope, and worthy of DAO attention even if the final vote may still be no.
- Process only when the proposal passed, action data matches the ratified proposal, and direct chain state says it is executable.

## Safety Rules

- Never invent values. If the mandate is missing, ask for or draft one first.
- Conviction alone is not authorization to broadcast. Broadcasting requires mandate alignment plus harness/task auto-send authority and live preflight.
- Re-read direct chain state before any sponsor/vote/process/cancel action.
- Use Graph for proposal metadata and vote history, but direct contract reads for current permission/timing checks.
- If the proposal changes agent authority, treasury custody, token permissions, or the mandate itself, escalate for human review.
- Record the final memo, chosen action, tx hash if any, and post-action state.

## Charter Integration

If the DAO has a charter, values statement, or ratified mandate:

- Prefer the latest ratified version over local defaults.
- Store the canonical URI/hash in the conviction profile.
- Link proposal reasoning back to the relevant charter section.
- For amendments, evaluate both the amendment content and the legitimacy of the process.

## Suggested Storage

For Prism, store the durable profile in harness-managed memory or runtime assets, for example:

```text
/data/custom/moloch-skills/profiles/<dao-or-agent>-conviction.json
```

Do not store private keys in the conviction profile.
