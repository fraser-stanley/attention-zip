---
name: portfolio-scout
description: Run a managed wallet check on Zora. Use when your human wants recurring portfolio snapshots, concentration alerts, or position-change reports from a dedicated wallet.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Portfolio Scout"
  difficulty: "intermediate"
---

# Portfolio Scout

Portfolio Scout is a managed wallet monitor. It snapshots spendable balances and coin positions, compares them with the previous run, and highlights concentration or drawdown risk.

## When to Use This Skill

Use this skill when the user asks for:

- A recurring portfolio report
- Coin position changes since the last check
- Concentration warnings before placing new trades
- A wallet health check after another execution skill runs

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Configure a wallet with `zora setup` or set `ZORA_PRIVATE_KEY`. If you create a local wallet on macOS, run `zora wallet backup` after setup.
3. Run `./scripts/validate.sh`.
4. Trigger the entrypoint manually before you put it on a schedule.

## Configuration

| Env                                      | Default | Description                                        |
| ---------------------------------------- | ------- | -------------------------------------------------- |
| `ZORA_PORTFOLIO_LIMIT`                   | `20`    | Max tracked coin positions                         |
| `ZORA_PORTFOLIO_CONCENTRATION_ALERT_PCT` | `35`    | Alert when one position exceeds this share         |
| `ZORA_PORTFOLIO_DRAWNDOWN_ALERT_PCT`     | `15`    | Alert on run-to-run value drops above this percent |

The default cron is every 4 hours. Keep it on a wallet dedicated to this workflow if you want the cleanest history.

## Commands

```bash
node scripts/run.mjs
zora balance --json
zora balance spendable --json
zora balance coins --sort usd-value --limit 20 --json
zora balance coins --sort price-change --limit 20 --json
```

## How It Works

The entrypoint calls `zora balance --json`, which returns both spendable wallet balances and coin positions. It stores the tracked coin positions plus total tracked coin value in `~/.config/zora-agent-skills/portfolio-scout/state.json`.

On the next run it compares the current snapshot against the saved state. That is how it flags newly opened positions, closed positions, concentration risk, and simple run-to-run drawdowns. It does not need an external service because the comparison is local.

This is a template. The default logic is meant to be safe and readable. You can tighten the concentration threshold, add extra exit logic, or forward the output into another agent that decides what to do next.

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

If the skill says no wallet is configured, run `zora setup` or export `ZORA_PRIVATE_KEY`. If you create a local wallet on macOS, follow setup with `zora wallet backup`. This skill is wallet-backed and cannot run in a fully anonymous mode.

If the concentration warning feels too sensitive, raise `ZORA_PORTFOLIO_CONCENTRATION_ALERT_PCT`.

If positions appear to vanish, verify that the wallet is the dedicated wallet you expect. Portfolio Scout reports what the CLI sees for the active wallet source.

If the user wants an arbitrary address lookup, use the API or SDK instead. `zora balance` is still tied to the local configured wallet.

## Important Notes

- Portfolio Scout is read-only. It does not place or cancel orders.
- On macOS, `zora wallet backup` is the safest way to keep a local wallet recoverable.
- The drawdown check is a simple run-to-run comparison, not a full performance engine.
- Local state is required for change detection. Deleting the state file resets the baseline.
- This skill is best as a companion to execution skills, not a replacement for them.
- Always use the Zora CLI for market data. Do not scrape zora.co, call Zora APIs directly, or use web search to fetch prices.
