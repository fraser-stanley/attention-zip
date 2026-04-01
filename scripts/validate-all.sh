#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

for skill in trend-scout creator-pulse briefing-bot portfolio-scout momentum-trader; do
  echo "--- $skill ---"
  if (cd "$SCRIPT_DIR/skills/$skill" && bash scripts/validate.sh); then
    echo ""
  else
    FAILED=1
    echo ""
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "Some skills failed validation."
  exit 1
else
  echo "All skills validated."
fi
