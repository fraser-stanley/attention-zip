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
- Stop-loss, take-profit, or trailing-stop exits
- Flip-flop guard blocking re-entry into exited coins

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

Schedule: every 10 minutes. Keep `autostart` off until dry-run looks right.

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
zora profile <identifier> --json
```

## How It Works

Loads state, refreshes positions, runs exits first. Exits log to `journal.jsonl`.

After cooldown/position/cap checks, pulls volume and trending, filters by gain and volume, drops flip-flop coins, quotes up to 5. `zora profile` can check creator history to deprioritize unproven creators. Dry run stops at the quote. Live enters the top pick.

### Decision Rules

| Condition | Action |
| --- | --- |
| Price below stop-loss | Exit, log reason |
| Price above take-profit | Exit, log reason |
| Price below trailing stop | Exit, log reason |
| Cooldown not elapsed | Block new entries |
| Position count at max | Block new entries |
| Daily ETH cap reached | Block new entries |
| Flip-flop cooldown active | Skip candidate |
| Quote slippage > threshold | Skip candidate |
| Coin is platform-blocked | Skip candidate |

## Example Output

```text
Momentum Trader
Run at 2026-03-23T13:40:00Z
Mode: dry-run

Positions: 1
- looksmaxxing, entry $0.000210, peak $0.000240, now $0.000170
  Stop-loss fired: -19.0% below entry

Candidates (3 evaluated, 1 filtered):
- Skipped FROGCOIN: flip-flop guard
1. hyperpop, +28.3%, $210K volume, slippage 1.2%
   Quote: 0.01 ETH -> 263 HYPERPOP
   Action: dry-run, no order sent
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No candidates | Filters too tight | Lower `MIN_GAIN_PCT` or `MIN_VOLUME_USD` |
| "Invalid address" | Name not resolved | Run `zora get <name> --json` first |
| Quotes failing | Low liquidity | Reduce `MAX_ETH` |
| Wrong wallet in live mode | Env misconfiguration | Unset `ZORA_MOMENTUM_LIVE`, rerun dry |
| Coin keeps getting skipped | Flip-flop cooldown | Lower `FLIPFLOP_RUNS` or wait |
| "Price moved too much" on buy | Slippage exceeded | Bump `MAX_SLIPPAGE_PCT` by 1-2%, or reduce `MAX_ETH` |
| "Not enough liquidity" on buy | Pool too shallow | Reduce `MAX_ETH`; do not loosen slippage |
| "Not enough funds" on buy | Cap or wallet depleted | Check `zora balance spendable`; wait for next window |

## Important Notes

### Mandates

- NEVER enable live mode without reviewing dry-run first, unless the user asks.
- NEVER raise daily cap beyond stated risk tolerance.
- ALWAYS run exits before entries. Quote before executing.
- Use a dedicated wallet.

The user has final say on overrides.

### Anti-Patterns

| Pattern | Consequence |
| --- | --- |
| Loosening slippage to force fills | Overpays on illiquid coins |
| Raising daily cap to chase momentum | Amplifies losses on reversal |
| Skipping exits to hold longer | Defeats stop-loss model |
| Re-entering flip-flop blocked coin | Churn erodes balance |
| Buying platform-blocked coins | Trade will fail |
