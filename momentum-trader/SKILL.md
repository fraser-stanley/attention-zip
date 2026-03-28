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

Finds momentum candidates, quotes entries, and manages stop-loss, take-profit, and trailing-stop exits. Dry run by default.

## When to Use This Skill

Use this skill when the user asks for:

- Recurring momentum scans and entries
- Dry-run candidate scans before a trade goes live
- Stop-loss, take-profit, or trailing-stop management
- A flip-flop guard that blocks re-entry into recently exited coins

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`. On macOS, run `zora wallet backup` before enabling live mode.
3. Run `./scripts/validate.sh`.
4. Leave `ZORA_MOMENTUM_LIVE=false` for the first manual run.

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

The schedule is every 10 minutes. Keep `autostart` off until the dry-run output looks correct.

Tuning: if slippage consistently exceeds 3%, reduce `ZORA_MOMENTUM_MAX_ETH` before loosening slippage. If no candidates appear, lower `ZORA_MOMENTUM_MIN_GAIN_PCT` or `ZORA_MOMENTUM_MIN_VOLUME_USD`. If exits fire too often, widen `ZORA_MOMENTUM_TRAILING_STOP`. Never raise `ZORA_MOMENTUM_DAILY_CAP_ETH` above what you can afford to lose in a day.

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

The script starts by loading state and refreshing positions from `zora balance coins`. Exits run first, in priority order: stop-loss, take-profit, trailing stop. Every exit logs a reasoning string to `journal.jsonl`.

New entries happen only after cooldown, position count, and daily cap checks pass. The skill pulls gainers and trending, filters by gain and volume, and drops anything blocked by the flip-flop guard. Each surviving candidate gets a `zora get` lookup to resolve its 0x address, then a quote. Up to 5 are quoted. High-slippage candidates are cut, the rest ranked by edge score. Dry run stops at the quote. Live mode enters the top pick and logs the result.

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

No candidates showing up? Lower `ZORA_MOMENTUM_MIN_GAIN_PCT` or `ZORA_MOMENTUM_MIN_VOLUME_USD`.

"Invalid address" on `buy` or `sell`? Resolve the name first with `zora get <name> --json`.

Quotes failing? Reduce `ZORA_MOMENTUM_MAX_ETH` before loosening slippage.

Wrong wallet and live mode is on? Unset `ZORA_MOMENTUM_LIVE` immediately and rerun dry.

A coin keeps getting skipped? It may be in the flip-flop cooldown. Lower `ZORA_MOMENTUM_FLIPFLOP_RUNS` or wait it out.

## Important Notes

- This skill can place real trades. Treat every live run as production.
- Dry run is the default and should stay the default for new installs.
- On macOS, back up any locally created wallet with `zora wallet backup`.
- The journal is part of the safety model. Every entry includes a reasoning string.
- Give it its own wallet. Do not point this at a wallet that other tools trade from.
- Use the Zora CLI for all market data. Do not scrape zora.co or call Zora APIs directly.
