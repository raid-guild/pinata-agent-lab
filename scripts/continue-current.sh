#!/usr/bin/env bash
set -euo pipefail

LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_DIR="$LAB_ROOT/.queue/run.lock"
CURRENT_FILE="$LAB_ROOT/.queue/current"
LOG_DIR="$LAB_ROOT/logs"
MODEL="${CODEX_MODEL:-gpt-5.5}"

mkdir -p "$LOG_DIR"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Another template build pass is already running: $LOCK_DIR"
  exit 0
fi

cleanup() {
  rm -rf "$LOCK_DIR"
}
trap cleanup EXIT

if [ ! -f "$CURRENT_FILE" ]; then
  echo "Missing current project file: $CURRENT_FILE" >&2
  exit 1
fi

PROJECT="$(tr -d '[:space:]' < "$CURRENT_FILE")"

if [ -z "$PROJECT" ]; then
  echo "Current project is empty." >&2
  exit 1
fi

STATUS_FILE="$LAB_ROOT/$PROJECT/BUILD_STATUS.md"

if [ ! -f "$STATUS_FILE" ]; then
  echo "Missing status file: $STATUS_FILE" >&2
  exit 1
fi

if rg -q '^State: complete$|^State: blocked$' "$STATUS_FILE"; then
  echo "Current project '$PROJECT' is already complete or blocked. Update .queue/current to continue."
  exit 0
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$LOG_DIR/${STAMP}-${PROJECT}.txt"

PROMPT="$(cat "$LAB_ROOT/RUNNER_PROMPT.md")

Current project from .queue/current: $PROJECT

Run one WIGUM pass. If the project reaches the definition of done, mark it complete and advance the queue. Otherwise leave it in progress with a clear Current task.
"

echo "Starting Codex pass for $PROJECT with model $MODEL"
echo "Log: $OUT_FILE"

cd "$LAB_ROOT"

codex exec \
  --model "$MODEL" \
  --cd "$LAB_ROOT" \
  --dangerously-bypass-approvals-and-sandbox \
  "$PROMPT" | tee "$OUT_FILE"

