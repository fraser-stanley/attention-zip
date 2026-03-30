---
name: momentum-trader
description: Scans gainers, scores candidates, and manages stop-loss, take-profit, and trailing-stop exits. Dry run by default.
metadata:
  author: "Zora Agent Skills"
  version: "2.1.0"
  displayName: "Momentum Trader"
  difficulty: "advanced"
---

# Momentum Trader

Finds momentum candidates, quotes entries, and manages exit rules. Dry run by default.

## When to Use This Skill

Use this skill when the user asks for:

- Recurring momentum scans and entries
- Dry-run candidate scans before going live
- Stop-loss, take-profit, or trailing-stop management
- A flip-flop guard blocking re-entry into recently exited coins

## Setup

1. Install the Zora CLI and `node`.
2. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`. On macOS, run `zora wallet backup`.
3. Run `./scripts/validate.sh`.
4. Leave `ZORA_MOMENTUM_LIVE=false` for the first run.

## Configuration

| Env                                  | Default | Description                              |
| ------------------------------------ | ------- | ---------------------------------------- |
| `ZORA_MOMENTUM_LIVE`                 | `false` | Enable real trading                      |
| `ZORA_MOMENTUM_MAX_ETH`              | `0.01`  | Max ETH per entry                        |
| `ZORA_MOMENTUM_MAX_POSITIONS`        | `3`     | Max tracked positions                    |
| `ZORA_MOMENTUM_MIN_GAIN_PCT`         | `15`    | Min 24h gain for candidates              |
| `ZORA_MOMENTUM_MIN_VOLUME_USD`       | `50000` | Min 24h volume                           |
| `ZORA_MOMENTUM_MAX_SLIPPAGE_PCT`     | `3`     | Slippage for quotes and orders           |
| `ZORA_MOMENTUM_TRAILING_STOP`        | `15`    | Exit pct drop from peak                  |
| `ZORA_MOMENTUM_COOLDOWN_SEC`         | `300`   | Delay between trades                     |
| `ZORA_MOMENTUM_DAILY_CAP_ETH`       | `0.05`  | Rolling daily spend limit                |
| `ZORA_MOMENTUM_STOP_LOSS_PCT`        | `25`    | Exit pct drop from entry                 |
| `ZORA_MOMENTUM_TAKE_PROFIT_PCT`      | `100`   | Exit pct rise from entry                 |
| `ZORA_MOMENTUM_FLIPFLOP_RUNS`        | `3`     | Re-entry block duration (runs)           |
| `ZORA_MOMENTUM_MAX_QUOTE_SLIPPAGE_PCT` | `5`  | Skip above this slippage                 |

Schedule: every 10 minutes. Keep `autostart` off until dry-run output looks correct.

## Commands

```bash
node scripts/run.mjs
zora explore --sort gainers --limit 12 --json
zora get <identifier> --json
zora balance coins --sort usd-value --limit 20 --json
zora buy <address> --eth 0.01 --quote --slippage 3 --json
zora buy <address> --eth 0.01 --token eth --slippage 3 --json --yes
zora sell <address> --percent 100 --to eth --slippage 3 --json --yes
```

## How It Works

Loads state, refreshes positions from `zora balance coins`, and runs exits first (stop-loss, take-profit, trailing stop). Every exit logs a reasoning string to `journal.jsonl`.

New entries run after cooldown, position count, and daily cap checks pass. Pulls gainers and trending, filters by gain and volume, drops flip-flop blocked coins, resolves addresses, and quotes up to 5 candidates. Dry run stops at the quote. Live mode enters the top pick.

### Decision Rules

| Condition | Action |
| --- | --- |
| Price below stop-loss from entry | Exit immediately, log reason |
| Price above take-profit from entry | Exit immediately, log reason |
| Price below trailing stop from peak | Exit immediately, log reason |
| Cooldown timer not elapsed | Block new entries |
| Position count at max | Block new entries |
| Daily ETH cap reached | Block new entries |
| Candidate in flip-flop cooldown | Skip candidate |
| Quote slippage > threshold | Skip candidate |

## Example Output

```text
Momentum Trader
Run at 2026-03-23T13:40:00Z
Mode: dry-run

Open positions tracked: 1
- looksmaxxing, entry $0.000210, peak $0.000240, current $0.000170
  Stop-loss fired: price $0.000170 is 19.0% below entry $0.000210

Candidates (3 evaluated, 1 filtered by slippage):
- Skipped FROGCOIN: exited recently (flip-flop guard)
1. hyperpop, +28.3%, $210K volume, slippage 1.2%
   Quote: 0.01 ETH -> 263 HYPERPOP
   Action: dry-run only, no order sent
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No candidates showing | Filters too tight | Lower `MIN_GAIN_PCT` or `MIN_VOLUME_USD` |
| "Invalid address" on buy/sell | Name not resolved | Run `zora get <name> --json` first |
| Quotes failing | Size too large for liquidity | Reduce `MAX_ETH` before loosening slippage |
| Wrong wallet in live mode | Env misconfiguration | Unset `ZORA_MOMENTUM_LIVE` immediately, rerun dry |
| Coin keeps getting skipped | Flip-flop cooldown active | Lower `FLIPFLOP_RUNS` or wait it out |

## Important Notes

### Mandates

- NEVER enable live mode without reviewing dry-run output first, unless the user explicitly asks to skip dry-run.
- NEVER raise daily cap beyond the user's stated risk tolerance.
- ALWAYS run exits before scanning for new entries. ALWAYS quote before executing.
- ALWAYS use a dedicated wallet. Back it up with `zora wallet backup` on macOS.
- ALWAYS use the Zora CLI for market data. Do not scrape zora.co or call Zora APIs directly.

The user has final say. If they explicitly override a mandate, respect their decision.

### Anti-Patterns

| Pattern | Consequence |
| --- | --- |
| Loosening slippage to force fills | Overpays on illiquid coins |
| Raising daily cap to chase momentum | Amplifies losses on reversal |
| Skipping exits to hold longer | Defeats the stop-loss safety model |
| Re-entering a flip-flop blocked coin | Churn erodes balance to fees |
