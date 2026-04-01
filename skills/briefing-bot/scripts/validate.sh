#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Validating briefing-bot..."

command -v zora >/dev/null || {
  echo "FAIL: zora CLI not found."
  exit 1
}
echo "  ok zora CLI installed"

zora --help >/dev/null 2>&1 || {
  echo "FAIL: zora CLI is installed but not runnable."
  exit 1
}
echo "  ok zora CLI responds"

command -v node >/dev/null || {
  echo "FAIL: node not found."
  exit 1
}
echo "  ok node installed"

node --check scripts/run.mjs >/dev/null
echo "  ok entrypoint parses"

echo "PASS: briefing-bot ready (read-only, wallet optional)"
