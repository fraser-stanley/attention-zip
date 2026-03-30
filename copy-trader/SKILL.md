---
name: copy-trader
description: Follows selected public wallets and mirrors their trades with spend caps, freshness checks, and price-drift limits. Dry run by default.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Copy Trader"
  difficulty: "advanced"
---

# Copy Trader

Follows selected public wallets, confirms recent swaps, and mirrors buys, trims, and exits. Dry run by default.

## When to Use This Skill

Use this skill when the user asks for:

- A copytrade loop driven by public Zora wallet activity
- Manual source-wallet following with optional leaderboard imports
- Dry-run checks before copied trades go live
- Proportional exits when a followed wallet trims or closes

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`.
3. Run `./scripts/validate.sh`.
4. Keep `ZORA_COPYTRADE_LIVE=false` until the dry-run output matches the sources you want.
5. On macOS, run `zora wallet export` and save the key securely before trusting this skill with live funds.

## Configuration

| Env | Default | Description |
| --- | --- | --- |
| `ZORA_COPYTRADE_LIVE` | `false` | Turns real copying on |
| `ZORA_COPYTRADE_SOURCE_ADDRESSES` | `""` | Comma-separated wallets or handles to follow |
| `ZORA_COPYTRADE_IMPORT_LEADERBOARD` | `false` | Pull extra sources from the Zora leaderboard |
| `ZORA_COPYTRADE_LEADERBOARD_COUNT` | `3` | Number of leaderboard traders to import |
| `ZORA_COPYTRADE_SPEND_TOKEN` | `eth` | Asset used for copied buys |
| `ZORA_COPYTRADE_EXIT_TOKEN` | `eth` | Asset received on copied sells |
| `ZORA_COPYTRADE_MAX_BUY_USD` | `25` | Cap per copied buy |
| `ZORA_COPYTRADE_DAILY_CAP_USD` | `100` | Spend cap per rolling day |
| `ZORA_COPYTRADE_MAX_POSITIONS` | `5` | Max copied positions tracked at once |

Advanced overrides for freshness, drift, concentration, and confirmation still work as env vars.

## Commands

```bash
node scripts/run.mjs
zora buy <address> --usd <amount> --token <asset> --quote --json
zora buy <address> --usd <amount> --token <asset> --slippage <pct> --json --yes
zora sell <address> --percent <pct> --to <asset> --quote --json
zora sell <address> --percent <pct> --to <asset> --slippage <pct> --json --yes
zora balance --json
zora balance coins --sort usd-value --limit 20 --json
```

## How It Works

The script loads the last source snapshot, looks up source wallets, optionally pulls a short leaderboard list, then fetches current balances. Deltas are classified as entries, adds, trims, or exits. Exits and trims run before entries. Copied positions get reconciled against the real wallet every run before any new live entries.

### Decision Rules

| Condition | Action |
| --- | --- |
| Source swap not confirmed in recent activity | Skip, log "unconfirmed" |
| Source swap age > freshness window | Skip, log "stale" |
| Price drift from source price > threshold | Skip, log "drift exceeded" |
| Quote slippage > limit | Skip, log "slippage" |
| Daily spend cap reached | Block all entries |
| Position count at max | Block new entries |
| Reconciliation mismatch detected | Halt entries, log safety event |

## Example Output

```text
Copy Trader
Run at 2026-03-27T13:40:00Z
Mode: dry-run
Health: healthy

Sources tracked: 2
- jacob, manual
- reef-X4B2, leaderboard

Confirmed source actions:
- BUY hyperpop from jacob, source age 54s, source $84.00, planned copy $25.00
  Quote: $25.00 -> 263 HYPERPOP, age 54s, drift +3.8%
  Action: dry-run only, no order sent
- SELL moonbag from reef-X4B2 skipped, stale exit, live mode skipped
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No sources tracked | Bad address or handle | Check `ZORA_COPYTRADE_SOURCE_ADDRESSES`, confirm public wallet |
| Snapshot changes unconfirmed | Lookback too short | Widen `CONFIRMATION_LOOKBACK_MIN` before loosening caps |
| Entries keep skipping | Freshness, drift, or slippage failing | Check each threshold in dry-run output before changing sizing |
| Live sells failing | Stale copied-position state | Re-run dry, inspect reconcile notes |
| Reconciliation mismatch | Wallet/state divergence | Safety event. Fix mismatch before anything else |

## Important Notes

### Mandates

- NEVER enable live mode without reviewing dry-run output first, unless the user explicitly asks to skip dry-run.
- NEVER raise the daily cap beyond the user's stated risk tolerance.
- ALWAYS run exits before entries. ALWAYS quote before executing.
- ALWAYS use a dedicated wallet. Back it up with `zora wallet export`.

The user has final say. If they explicitly override a mandate, respect their decision.

### Anti-Patterns

| Pattern | Consequence |
| --- | --- |
| Loosening slippage to force fills | Overpays on illiquid coins |
| Raising daily cap to chase a run | Amplifies losses on reversal |
| Ignoring reconciliation mismatches | Trades against stale state |
| Copying without confirming source swap | Follows phantom deltas |
