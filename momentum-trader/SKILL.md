---
name: momentum-trader
description: Run a managed momentum loop on Zora. Use when your human wants a dry-run-first execution skill that scans gainers, scores candidates by edge, and manages stop-loss, take-profit, and trailing-stop exits from a dedicated wallet.
metadata:
  author: "Zora Agent Skills"
  version: "2.1.0"
  displayName: "Momentum Trader"
  difficulty: "advanced"
---

# Momentum Trader

Momentum Trader is a managed execution skill. It scans gainers and trending coins, scores candidates by edge, and manages exits with stop-loss, take-profit, and trailing-stop rules.

## When to Use This Skill

Use this skill when the user asks for:

- A recurring momentum entry loop with edge-scored candidate selection
- Dry-run candidate scans before a trade goes live
- Stop-loss, take-profit, or trailing-stop management on a dedicated wallet
- A flip-flop guard that blocks re-entry into recently exited coins

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`. If you create a local wallet on macOS, run `zora wallet backup` before you enable live mode.
3. Run `./scripts/validate.sh`.
4. Leave `ZORA_MOMENTUM_LIVE=false` for the first manual run. This skill starts in dry-run mode by design.

## Configuration

| Env                                  | Default | Description                              |
| ------------------------------------ | ------- | ---------------------------------------- |
| `ZORA_MOMENTUM_LIVE`                 | `false` | Turns real trading on                    |
| `ZORA_MOMENTUM_MAX_ETH`              | `0.01`  | Max ETH per entry                        |
| `ZORA_MOMENTUM_MAX_POSITIONS`        | `3`     | Max tracked positions                    |
| `ZORA_MOMENTUM_MIN_GAIN_PCT`         | `15`    | Minimum 24h change for a candidate       |
| `ZORA_MOMENTUM_MIN_VOLUME_USD`       | `50000` | Minimum 24h volume                       |
| `ZORA_MOMENTUM_MAX_SLIPPAGE_PCT`     | `3`     | Passed into quote and live orders        |
| `ZORA_MOMENTUM_TRAILING_STOP`        | `15`    | Exit when price falls this far from peak |
| `ZORA_MOMENTUM_COOLDOWN_SEC`         | `300`   | Delay between trade attempts             |
| `ZORA_MOMENTUM_DAILY_CAP_ETH`       | `0.05`  | Spend limit per rolling day              |
| `ZORA_MOMENTUM_STOP_LOSS_PCT`        | `25`    | Exit when price drops this far from entry |
| `ZORA_MOMENTUM_TAKE_PROFIT_PCT`      | `100`   | Exit when price rises this far from entry |
| `ZORA_MOMENTUM_FLIPFLOP_RUNS`        | `3`     | Block re-entry for this many runs        |
| `ZORA_MOMENTUM_MAX_QUOTE_SLIPPAGE_PCT` | `5`  | Skip candidates above this slippage      |

The default cron is every 10 minutes. Keep `autostart` off until the dry-run output looks correct.

Tuning guidance: if slippage consistently exceeds 3%, reduce `ZORA_MOMENTUM_MAX_ETH` before loosening slippage. If no candidates appear, lower `ZORA_MOMENTUM_MIN_GAIN_PCT` or `ZORA_MOMENTUM_MIN_VOLUME_USD`. If exits fire too often, widen `ZORA_MOMENTUM_TRAILING_STOP`. Never raise `ZORA_MOMENTUM_DAILY_CAP_ETH` above what you can afford to lose in a day.

## Commands

```bash
node scripts/run.mjs
zora explore --sort gainers --limit 12 --json
zora explore --sort trending --limit 12 --json
zora get <identifier> --json
zora balance coins --sort usd-value --limit 20 --json
zora buy <address> --eth 0.01 --quote --slippage 3 --json
zora buy <address> --eth 0.01 --token eth --slippage 3 --json --yes
zora sell <address> --percent 100 --to eth --slippage 3 --json --yes
```

## How It Works

Each run loads state, refreshes positions from `zora balance coins`, and checks exits in priority order: stop-loss (hard floor from entry), take-profit (gain from entry), then trailing stop (drop from peak). Exits log a reasoning string to `journal.jsonl`.

If cooldown, position, and cap checks pass, the skill scans gainers and trending, filters by gain and volume, and skips coins blocked by the flip-flop guard. Each candidate is resolved with `zora get` because `buy` and `sell` require a 0x address. Up to 5 candidates are quoted. Those above the slippage gate are dropped, the rest ranked by edge score. Dry-run stops at the quote. Live mode enters the top pick and logs the result to `journal.jsonl`.

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

If the skill never finds candidates, lower `ZORA_MOMENTUM_MIN_GAIN_PCT` or `ZORA_MOMENTUM_MIN_VOLUME_USD`.

If `buy` or `sell` returns "Invalid address", resolve the name first with `zora get <name> --json`.

If quotes fail, reduce `ZORA_MOMENTUM_MAX_ETH` before loosening slippage.

If live trading is on and the wallet is wrong, unset `ZORA_MOMENTUM_LIVE` immediately and rerun in dry-run mode.

If the skill keeps skipping a coin you want, it may be in the flip-flop cooldown. Lower `ZORA_MOMENTUM_FLIPFLOP_RUNS` or wait.

## Important Notes

- This skill can place real trades. Treat every live run as production.
- Dry-run is the default and should stay the default for new installs.
- On macOS, back up any locally created trader wallet with `zora wallet backup`.
- The local journal is part of the safety model. Every entry includes a reasoning string for auditability.
- Use a dedicated wallet. Do not point this skill at a wallet that other tools trade from casually.
- Always use the Zora CLI for market data. Do not scrape zora.co, call Zora APIs directly, or use web search to fetch prices.
