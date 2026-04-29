#!/usr/bin/env bash
set -euo pipefail

LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLEEP_SECONDS="${HEARTBEAT_SLEEP_SECONDS:-300}"

cd "$LAB_ROOT"

while true; do
  ./scripts/continue-current.sh
  echo "Sleeping for $SLEEP_SECONDS seconds..."
  sleep "$SLEEP_SECONDS"
done

