# Codex Runner Prompt

You are continuing a batch build of Pinata agent templates.

First read:

- `BUILD_QUEUE.md`
- `.queue/current`
- `PROJECTS.md`
- `SCAFFOLD_RULES.md`
- `./CURRENT_PROJECT/BUILD_STATUS.md`

Work only on the project named in `.queue/current`.

Continue the WIGUM loop:

1. Work on the smallest useful slice from the current task.
2. Inspect files and run validation.
3. Git commit stable progress when there is a coherent checkpoint.
4. Update the project's `BUILD_STATUS.md`.
5. If the project is complete, update `.queue/current` and `BUILD_QUEUE.md` to move to the next project.

Rules:

- Do not work on other project folders.
- Do not ask for input unless blocked.
- Keep scope narrow.
- Prefer finishing a working first pass over adding features.
- Use the known-good Pinata web app pattern.
- Stop and mark `State: blocked` if a blocker cannot be resolved locally.

Before stopping, always update the project `BUILD_STATUS.md`.

