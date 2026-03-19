#!/usr/bin/env bash
set -euo pipefail

echo "Validating trend-scout..."

if ! command -v zora &>/dev/null; then
  echo "FAIL: zora CLI not found. Install with: npm install -g @zoralabs/cli"
  exit 1
fi
echo "  ✓ zora CLI installed"

if ! zora auth status &>/dev/null; then
  echo "  ⚠ API key not configured (optional). Run: zora auth configure"
else
  echo "  ✓ API key configured"
fi

echo "PASS: trend-scout ready"
