---
name: momentum-trader
description: Scans volume leaders and trending coins, scores candidates, and manages stop-loss, take-profit, and trailing-stop exits. Dry run by default.
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

1. Install the Zora CLI: `npm install -g @zoralabs/cli` (requires Node.js 20+).
2. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`. Back up with `zora wallet export`.
3. Run `./scripts/validate.sh`.
4. Leave `ZORA_MOMENTUM_LIVE=false` for the first run.

## Configuration

| Env                                  | Default | Description                              |
| ------------------------------------ | ------- | ---------------------------------------- |
| `ZORA_MOMENTUM_LIVE`                 | `false` | Enable real trading                      |
| `ZORA_MOMENTUM_LIMIT`               | `12`    | Scan depth (coins per query)             |
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

Schedule: every 10 minutes. Keep `autostart` off until dry-run output is correct.

## Commands

```bash
node scripts/run.mjs
zora explore --sort volume --type all --limit 12 --json
zora explore --sort trending --type all --limit 12 --json
zora get <identifier> --json
zora balance coins --sort usd-value --limit 20 --json
zora buy <identifier> --eth <amount> --quote --json
zora buy <identifier> --eth <amount> --slippage <pct> --json --yes
zora sell <identifier> --percent 100 --to eth --slippage <pct> --json --yes
zora price-history <identifier> --interval 24h --json
```

## How It Works

Loads state, refreshes positions, runs exits first (stop-loss, take-profit, trailing stop). Exits log to `journal.jsonl`.

After cooldown/position/cap checks, pulls volume and trending, filters by gain and volume, drops flip-flop coins, quotes up to 5 candidates. Dry run stops at the quote. Live mode enters the top pick.

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
| Coin is platform-blocked | Skip candidate, log "blocked" |

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

- NEVER enable live mode without reviewing dry-run output first, unless the user explicitly asks.
- NEVER raise daily cap beyond the user's stated risk tolerance.
- ALWAYS run exits before new entries. Quote before executing.
- Use a dedicated wallet.
- Use the Zora CLI for all market data.

The user has final say on overrides.

### Anti-Patterns

| Pattern | Consequence |
| --- | --- |
| Loosening slippage to force fills | Overpays on illiquid coins |
| Raising daily cap to chase momentum | Amplifies losses on reversal |
| Skipping exits to hold longer | Defeats the stop-loss safety model |
| Re-entering a flip-flop blocked coin | Churn erodes balance to fees |
| Buying platform-blocked coins | Trade will fail; sell/send still works for exiting |
