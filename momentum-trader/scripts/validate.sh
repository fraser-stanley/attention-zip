#!/usr/bin/env bash
set -euo pipefail

echo "Validating momentum-trader..."

command -v zora >/dev/null || {
  echo "FAIL: zora CLI not found."
  exit 1
}
echo "  ok zora CLI installed"

command -v node >/dev/null || {
  echo "FAIL: node not found."
  exit 1
}
echo "  ok node installed"

node --check scripts/run.mjs >/dev/null
echo "  ok entrypoint parses"

if ! zora wallet info >/dev/null 2>&1; then
  echo "FAIL: no wallet configured. Run 'zora setup --create' or set ZORA_PRIVATE_KEY."
  exit 1
fi
echo "  ok wallet available"

echo "PASS: momentum-trader ready"
echo "  note live trading stays off until ZORA_MOMENTUM_LIVE=true"
