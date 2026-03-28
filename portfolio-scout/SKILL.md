---
name: portfolio-scout
description: Snapshots wallet positions and flags concentration, drawdowns, and position changes on a schedule.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Portfolio Scout"
  difficulty: "intermediate"
---

# Portfolio Scout

Reads wallet balances and coin positions. Flags new entries, exits, and concentration risk.

## When to Use This Skill

Use this skill when the user asks for:

- A recurring portfolio report
- Coin position changes since the last check
- Concentration warnings before placing new trades
- A wallet health check after another skill runs

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Configure a wallet with `zora setup` or set `ZORA_PRIVATE_KEY`. On macOS, run `zora wallet backup` after setup.
3. Run `./scripts/validate.sh`.
4. Trigger the script manually before putting it on a schedule.

## Configuration

| Env                                      | Default | Description                                        |
| ---------------------------------------- | ------- | -------------------------------------------------- |
| `ZORA_PORTFOLIO_LIMIT`                   | `20`    | Max tracked coin positions                         |
| `ZORA_PORTFOLIO_CONCENTRATION_ALERT_PCT` | `35`    | Alert when one position exceeds this share         |
| `ZORA_PORTFOLIO_DRAWNDOWN_ALERT_PCT`     | `15`    | Alert on run-to-run value drops above this percent |

The schedule is every 4 hours. Keep it on a dedicated wallet for the cleanest history.

## Commands

```bash
node scripts/run.mjs
zora balance --json
zora balance spendable --json
zora balance coins --sort usd-value --limit 20 --json
zora balance coins --sort price-change --limit 20 --json
```

## How It Works

`zora balance --json` returns spendable balances and coin positions. The script stores tracked positions and total value in `~/.config/zora-agent-skills/portfolio-scout/state.json`.

Next run, it diffs the current snapshot against saved state: new positions, closed positions, concentration risk, run-to-run drawdowns. All local, no external service.

## Example Output

```text
Portfolio Scout
Run at 2026-03-23T12:00:00Z

Spendable:
- 0.42 ETH
- 183.20 USDC

Coin positions:
1. jacob, $4,120.00, 68.1% of tracked coin value
2. looksmaxxing, $1,150.00, 19.0% of tracked coin value

Alerts:
- Concentration warning: jacob is above the 35% threshold
- based penguin is no longer held
```

## Troubleshooting

"No wallet configured" means you need `zora setup` or `ZORA_PRIVATE_KEY`. On macOS, follow setup with `zora wallet backup`.

Concentration warning too sensitive? Raise `ZORA_PORTFOLIO_CONCENTRATION_ALERT_PCT`.

Positions vanishing? Make sure the wallet is the one you expect. Portfolio Scout reports what the CLI sees for the active wallet source.

Want to check someone else's wallet? Use the API or SDK. `zora balance` reads only the local wallet.

## Important Notes

- Portfolio Scout is read-only. It does not place or cancel orders.
- On macOS, `zora wallet backup` keeps a local wallet recoverable.
- The drawdown check is a simple run-to-run comparison, not a full performance engine.
- Deleting the state file resets the baseline.
- Pairs well with execution skills like Momentum Trader or Copy Trader.
- Use the Zora CLI for all market data. Do not scrape zora.co or call Zora APIs directly.
