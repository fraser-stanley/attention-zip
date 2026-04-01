#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Validating copy-trader..."

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

if ! zora wallet info >/dev/null 2>&1; then
  echo "FAIL: no wallet configured — this skill requires a wallet. Run 'zora setup --create' or set ZORA_PRIVATE_KEY."
  echo "  note read-only skills (trend-scout, creator-pulse, briefing-bot) work without a wallet"
  exit 1
fi
echo "  ok wallet available"

echo "  note run 'zora wallet export' and save the key securely"

echo "PASS: copy-trader ready (wallet required)"
echo "  note public reads require outbound access to api-sdk.zora.engineering"
echo "  note live trading stays off until ZORA_COPYTRADE_LIVE=true"
