#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/fraser-stanley/attention-zip"
SKILLS_DIR="$HOME/.config/zora-agent-skills"
TMP_DIR="$(mktemp -d)"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "attention.zip skill installer"
echo ""

# 1. Check Node.js 20+
if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node is not installed. Install Node.js 20+ and re-run."
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "FAIL: node $NODE_MAJOR found, but 20+ is required."
  exit 1
fi
echo "ok node $NODE_MAJOR"

# 2. Install Zora CLI if missing
if command -v zora >/dev/null 2>&1; then
  echo "ok zora CLI already installed"
else
  echo "Installing @zoralabs/cli..."
  npm install -g @zoralabs/cli
  if ! command -v zora >/dev/null 2>&1; then
    echo "FAIL: zora CLI install did not succeed."
    exit 1
  fi
  echo "ok zora CLI installed"
fi

# 3. Clone skills
echo "Cloning skills into $SKILLS_DIR..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR/repo"
mkdir -p "$SKILLS_DIR"
cp -r "$TMP_DIR/repo/skills"/* "$SKILLS_DIR/"
echo "ok skills copied"

# 4. Validate each skill
PASSED=0
WALLET_NEEDED=0
FAILED=0

for skill_dir in "$SKILLS_DIR"/*/; do
  skill="$(basename "$skill_dir")"
  validate="$skill_dir/scripts/validate.sh"

  if [ ! -f "$validate" ]; then
    continue
  fi

  if bash "$validate" >/dev/null 2>&1; then
    PASSED=$((PASSED + 1))
  else
    # Check if it failed only on the wallet gate
    if bash "$validate" 2>&1 | grep -q "no wallet configured"; then
      WALLET_NEEDED=$((WALLET_NEEDED + 1))
    else
      FAILED=$((FAILED + 1))
    fi
  fi
done

# 5. Summary
echo ""
echo "--- Summary ---"
echo "Passed:         $PASSED"
[ "$WALLET_NEEDED" -gt 0 ] && echo "Need wallet:    $WALLET_NEEDED (run 'zora setup --create')"
[ "$FAILED" -gt 0 ] && echo "Failed:         $FAILED"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo "Some skills failed validation. Check the output above."
  exit 1
fi

echo "Done. Try: \"What's trending on Zora right now?\""
