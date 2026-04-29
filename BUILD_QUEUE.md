# Build Queue

State: in_progress

Current project:
- practice-coach

Queue:
- practice-coach
- field-notes-research
- memory-garden
- community-quest-board

Completed:
- micro-crm

Blocked:
- none

## Runner Notes

The script reads `.queue/current` as the machine-readable current project. Keep this file aligned with the "Current project" section above.

When a project reaches `State: complete`, Codex should:

- add it to Completed
- set `.queue/current` to the next project
- update the Current project section

When a project reaches `State: blocked`, Codex should:

- add it to Blocked with a short reason
- leave `.queue/current` unchanged unless the blocker is intentionally skipped
