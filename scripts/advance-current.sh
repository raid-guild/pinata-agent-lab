#!/usr/bin/env bash
set -euo pipefail

LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CURRENT_FILE="$LAB_ROOT/.queue/current"
PROJECTS_FILE="$LAB_ROOT/.queue/projects"

CURRENT="$(tr -d '[:space:]' < "$CURRENT_FILE")"
NEXT=""
FOUND="false"

while IFS= read -r project; do
  [ -z "$project" ] && continue
  if [ "$FOUND" = "true" ]; then
    NEXT="$project"
    break
  fi
  if [ "$project" = "$CURRENT" ]; then
    FOUND="true"
  fi
done < "$PROJECTS_FILE"

if [ -z "$NEXT" ]; then
  echo "No next project after '$CURRENT'. Queue may be complete."
  exit 0
fi

printf '%s\n' "$NEXT" > "$CURRENT_FILE"
echo "Advanced current project from '$CURRENT' to '$NEXT'."

