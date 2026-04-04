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

Follows public wallets, confirms swaps, and mirrors buys, trims, and exits. Dry run by default.

## When to Use This Skill

Use this skill when the user asks for:

- A copytrade loop following public Zora wallets
- Leaderboard imports or manual source-wallet following
- Dry-run checks before going live
- Proportional exits when a source trims or closes

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli` (requires Node.js 20+).
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`.
3. Run `./scripts/validate.sh`.
4. Keep `ZORA_COPYTRADE_LIVE=false` until dry-run output looks right.
5. Back up with `zora wallet export` before going live.

## Configuration

| Env | Default | Description |
| --- | --- | --- |
| `ZORA_COPYTRADE_LIVE` | `false` | Turns real copying on |
| `ZORA_COPYTRADE_SOURCE_ADDRESSES` | `""` | Comma-separated wallets or handles |
| `ZORA_COPYTRADE_IMPORT_LEADERBOARD` | `false` | Import from the Zora leaderboard |
| `ZORA_COPYTRADE_LEADERBOARD_COUNT` | `3` | Leaderboard traders to import |
| `ZORA_COPYTRADE_SPEND_TOKEN` | `eth` | Asset used for copied buys |
| `ZORA_COPYTRADE_EXIT_TOKEN` | `eth` | Asset received on copied sells |
| `ZORA_COPYTRADE_MAX_BUY_USD` | `25` | Cap per copied buy |
| `ZORA_COPYTRADE_DAILY_CAP_USD` | `100` | Spend cap per rolling day |
| `ZORA_COPYTRADE_MAX_POSITIONS` | `5` | Max copied positions at once |

Freshness, drift, and concentration overrides available as env vars.

## Commands

```bash
node scripts/run.mjs
zora buy <address> --usd <amount> --token <asset> --quote --json
zora buy <address> --usd <amount> --token <asset> --slippage <pct> --json --yes
zora sell <address> --percent <pct> --to <asset> --quote --json
zora sell <address> --percent <pct> --to <asset> --slippage <pct> --json --yes
zora balance --json
zora balance coins --sort usd-value --limit 20 --json
zora price-history <identifier> --interval 1h --json
```

## How It Works

Loads the last snapshot, resolves sources, optionally imports leaderboard traders, fetches balances. Deltas are classified as entries, adds, trims, or exits. Exits run before entries. Positions reconcile against the wallet every run.

Before copying, `zora price-history` checks whether price reversed since the source swap. If so, the copy is skipped. This supplements the drift gate.

### Decision Rules

| Condition | Action |
| --- | --- |
| Source swap not confirmed | Skip, log "unconfirmed" |
| Source swap age > freshness window | Skip, log "stale" |
| Price drift from source price > threshold | Skip, log "drift exceeded" |
| Price reversed since source swap (1h history) | Skip, log "momentum reversed" |
| Quote slippage > limit | Skip, log "slippage" |
| Daily spend cap reached | Block all entries |
| Position count at max | Block new entries |
| Reconciliation mismatch detected | Halt entries, log safety event |
| Target coin is platform-blocked | Skip entry, log "blocked" |

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
- BUY hyperpop from jacob, age 54s, source $84, copy $25
  Quote: $25 -> 263 HYPERPOP, drift +3.8%
  Action: dry-run, no order sent
- SELL moonbag from reef-X4B2 skipped, stale exit
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No sources tracked | Bad address or handle | Check `SOURCE_ADDRESSES`, confirm public wallet |
| Snapshot changes unconfirmed | Lookback too short | Widen `CONFIRMATION_LOOKBACK_MIN` |
| Entries keep skipping | Freshness, drift, or slippage | Check thresholds in dry-run output |
| Live sells failing | Stale position state | Re-run dry, inspect reconcile notes |
| Reconciliation mismatch | Wallet/state divergence | Fix mismatch before anything else |
| "Price moved too much" | Price shifted since source swap | Tighten drift threshold |
| "Not enough liquidity" | Coin too illiquid | Reduce `MAX_BUY_USD` |
| "Not enough funds" | Daily cap hit | Wait for next window; do not raise cap |

## Important Notes

### Mandates

- NEVER enable live mode without reviewing dry-run output first, unless the user explicitly asks.
- NEVER raise the daily cap beyond the user's stated risk tolerance.
- ALWAYS run exits before entries. Quote before executing.
- Use a dedicated wallet.

The user has final say on overrides.

### Anti-Patterns

| Pattern | Consequence |
| --- | --- |
| Loosening slippage to force fills | Overpays on illiquid coins |
| Raising daily cap to chase a run | Amplifies losses on reversal |
| Ignoring reconciliation mismatches | Trades against stale state |
| Copying without confirming source swap | Follows phantom deltas |
| Copying buys into blocked coins | Buy will fail; sell/send still works for exits |
| Copying after price has reversed | Enters at local top, immediate loss |
