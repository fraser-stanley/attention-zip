#!/usr/bin/env bash
set -euo pipefail

echo "Validating momentum-trader..."

if ! command -v zora &>/dev/null; then
  echo "FAIL: zora CLI not found. Install with: npm install -g @zoralabs/cli"
  exit 1
fi
echo "  ✓ zora CLI installed"

if ! zora auth status &>/dev/null; then
  echo "FAIL: API key not configured. Required for trading. Run: zora auth configure"
  exit 1
fi
echo "  ✓ API key configured"

if ! zora wallet info &>/dev/null; then
  echo "FAIL: No wallet configured. Create a dedicated trader wallet: zora setup --create"
  exit 1
fi
echo "  ✓ Wallet configured"

echo ""
echo "PASS: momentum-trader ready"
echo "  ⚠ This skill executes real trades with real ETH. Use --quote for dry-runs."
