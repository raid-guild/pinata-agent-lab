# Pinata Template Lab

Batch workspace for building Pinata agent template scaffolds one at a time with Codex.

## Projects

- `micro-crm` - Micro CRM for Solo Operators
- `practice-coach` - Personal Practice Coach
- `field-notes-research` - Field Notes Research Agent
- `memory-garden` - Memory Garden
- `community-quest-board` - Community Quest Board
- `raidguild-agent-app-starter` - generic Next.js + SQLite starter pattern

## Process

Use the WIGUM loop:

- Work: implement the smallest useful slice.
- Inspect: run checks and inspect files.
- Git: commit stable progress.
- Update: update `BUILD_STATUS.md` and `BUILD_QUEUE.md`.
- Move: continue to the next task or project.

Each project owns its own folder and `BUILD_STATUS.md`. The batch runner reads `.queue/current` and only works on that project.

## Manual Run

Run one continuation pass:

```sh
./scripts/continue-current.sh
```

Run continuously with a pause between passes:

```sh
./scripts/heartbeat.sh
```

## Cron

Only use cron after manual runs work. The single-pass script has a global lock, so this will skip if another pass is already active:

```cron
*/15 * * * * cd /home/dekanjbrown/Projects/raidguild/pinata-sites/pinata-template-lab && ./scripts/continue-current.sh >> logs/cron.log 2>&1
```

## Safety

- The runner works on one project at a time.
- It uses one global lock: `.queue/run.lock`.
- It defaults to `gpt-5.5`.
- It uses Codex yolo mode via `--dangerously-bypass-approvals-and-sandbox`.
- It stops when the current project is marked `State: complete` or `State: blocked`.
