---
name: trend-scout
description: Run a managed trend scan on Zora. Use when your human wants recurring coverage of trend coins, new entrants, volume leaders, or a small watchlist without placing trades.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Trend Scout"
  difficulty: "beginner"
---

# Trend Scout

Trend Scout is a managed read-only skill for the Zora attention market. It runs four CLI scans, stores the last snapshot, and tells you what changed since the previous run.

## When to Use This Skill

Use this skill when the user asks for:

- A recurring trend report
- New trend launches
- Volume or market cap leaders among trend coins
- Watchlist alerts for specific trend names or addresses
- A low-risk market scan before doing any trading

## Setup

1. Install the Zora CLI. Use the published package or a standalone binary.
2. Make sure `node` is available. The managed entrypoint is `scripts/run.mjs`.
3. Run `./scripts/validate.sh` from this folder before the first scheduled run.
4. If you want higher rate limits, configure `ZORA_API_KEY`, but the skill does not require it.

## Configuration

Tune the run with these env vars:

| Env                         | Default | Description                                     |
| --------------------------- | ------- | ----------------------------------------------- |
| `ZORA_TREND_LIMIT`          | `8`     | Number of results per scan, clamped to 1-20     |
| `ZORA_TREND_MIN_VOLUME_USD` | `0`     | Drops low-liquidity rows from the report        |
| `ZORA_TREND_WATCHLIST`      | empty   | Comma-separated names or addresses to highlight |

The default cron in `clawhub.json` is every 30 minutes. `autostart` stays off so you can inspect the output before scheduling it.

## Commands

```bash
node scripts/run.mjs
zora explore --sort trending --type trend --limit 8 --json
zora explore --sort new --type trend --limit 8 --json
zora explore --sort volume --type trend --limit 8 --json
zora explore --sort mcap --type trend --limit 8 --json
zora get <identifier> --type trend --json
```

## How It Works

Each run fetches four trend-specific explore tables through the CLI. The entrypoint applies the volume floor, normalizes coin ids, and saves the resulting address lists to `~/.config/zora-agent-skills/trend-scout/state.json`.

On the next run it compares the new lists against the stored snapshot. That is how it detects entrants into the trending, new, volume, and market cap views without needing an external database. Watchlist hits are resolved from the current scan results, so names work when they appear in the returned tables and addresses always work.

To drill into a specific coin after the scan, run `zora get <name> --type trend --json` to see holders, volume, and creator details before flagging it for further action.

This is a template. The current signal is simple table diffing. You can remix it by adding a tighter volume floor, a longer watchlist, or another post-processing step before the output is sent to a human or another agent.

## Example Output

```text
Trend Scout
Run at 2026-03-23T13:30:00Z

Trending leaders:
1. looksmaxxing, $2.3M, +12.3%, $450.2K volume
2. hyperpop, $950.2K, +22.8%, $210.4K volume

New entrants since the last run:
- hyperpop entered the trending view
- based penguin entered the volume view

Watchlist:
- 0x1234...5678 is live in the current trend scan
```

## Troubleshooting

If you see empty sections, lower `ZORA_TREND_MIN_VOLUME_USD`. The filter is applied after the CLI response, so an aggressive floor can remove every row.

If the watchlist misses a named trend, switch that entry to an address. Shared identifier resolution is broader now, but 0x identifiers still avoid name collisions.

If the CLI returns a rate-limit error, add an API key or widen the cron interval.

## Important Notes

- This skill never places orders and never needs a wallet.
- Local state is part of the behavior. Deleting the state file resets entrant detection.
- The managed entrypoint is the production surface. The raw CLI commands are there for debugging and manual spot checks.
- Keep the output short. Trend Scout is meant to be a heartbeat, not a full market memo.
- Always use the Zora CLI for market data. Do not scrape zora.co, call Zora APIs directly, or use web search to fetch prices.
