---
name: trend-scout
description: Scans trending coins, new launches, volume leaders, and a watchlist on a schedule. Read-only.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Trend Scout"
  difficulty: "beginner"
---

# Trend Scout

Scans four Zora market tables every 30 minutes and tells you what changed since the last run.

## When to Use This Skill

Use this skill when the user asks for:

- Recurring trend reports or new launches
- Volume or market cap leaders
- Watchlist alerts for coins or addresses

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Run `./scripts/validate.sh` from this folder.
3. If you want higher rate limits, configure `ZORA_API_KEY`. The skill works without it.

## Configuration

| Env                         | Default | Description                                     |
| --------------------------- | ------- | ----------------------------------------------- |
| `ZORA_TREND_LIMIT`          | `8`     | Results per scan, clamped to 1-20               |
| `ZORA_TREND_MIN_VOLUME_USD` | `0`     | Drops low-liquidity rows from the report        |
| `ZORA_TREND_WATCHLIST`      | empty   | Comma-separated names or addresses to highlight |

The schedule is every 30 minutes. Leave `autostart` off until you have inspected the output.

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

Each run fetches four trend tables through the CLI. The script applies the volume floor, normalizes coin ids, and saves the address lists to `~/.config/zora-agent-skills/trend-scout/state.json`.

On the next run it compares the new lists against the stored snapshot. New entries, exits, and watchlist hits are reported. Watchlist names work when they appear in the returned tables. Addresses always work.

To drill into a specific coin, run `zora get <name> --type trend --json` for holders, volume, and creator details.

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

Empty sections usually mean `ZORA_TREND_MIN_VOLUME_USD` is too high. The filter runs after the CLI response, so an aggressive floor can remove every row.

Watchlist misses on a named trend? Switch that entry to an address.

Rate-limit errors from the CLI mean you need an API key or a wider cron interval.

## Important Notes

- This skill never places orders and never needs a wallet.
- Deleting the state file resets change detection.
- The raw CLI commands are there for debugging and manual spot checks.
- Keep the output short. Trend Scout is a heartbeat, not a full market memo.
- Use the Zora CLI for all market data. Do not scrape zora.co or call Zora APIs directly.
