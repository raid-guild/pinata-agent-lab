#!/usr/bin/env bash
set -euo pipefail

LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Current project: $(cat "$LAB_ROOT/.queue/current")"
echo
sed -n '1,80p' "$LAB_ROOT/BUILD_QUEUE.md"
echo

for project in $(cat "$LAB_ROOT/.queue/projects"); do
  echo "== $project =="
  sed -n '1,28p' "$LAB_ROOT/$project/BUILD_STATUS.md"
  echo
done

