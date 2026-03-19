#!/usr/bin/env bash
set -euo pipefail

echo "Validating briefing-bot..."

if ! command -v zora &>/dev/null; then
  echo "FAIL: zora CLI not found. Install with: npm install -g @zoralabs/cli"
  exit 1
fi
echo "  ✓ zora CLI installed"

if ! zora auth status &>/dev/null; then
  echo "  ⚠ API key not configured. Briefing runs 5 CLI calls per digest — rate limits likely without a key. Run: zora auth configure"
else
  echo "  ✓ API key configured"
fi

echo "PASS: briefing-bot ready"
