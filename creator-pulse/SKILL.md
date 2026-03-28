---
name: creator-pulse
description: Watches featured creators and creator-coin momentum on a schedule. Read-only.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Creator Pulse"
  difficulty: "intermediate"
---

# Creator Pulse

Tracks featured, trending, and top-volume creator coins. Alerts when your watchlist moves.

## When to Use This Skill

Use this skill when the user asks for:

- Featured creator updates
- A recurring creator-coin watchlist
- Alerts on volume or holder-count changes
- Which creators are moving this week

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Run `./scripts/validate.sh` in this folder.
3. Set `ZORA_CREATOR_WATCHLIST` if you want per-creator alerts.
4. An API key is optional. It helps on a tight schedule.

## Configuration

| Env                           | Default | Description                                  |
| ----------------------------- | ------- | -------------------------------------------- |
| `ZORA_CREATOR_LIMIT`          | `8`     | Rows fetched per creator view                |
| `ZORA_CREATOR_MIN_VOLUME_USD` | `0`     | Filters thin rows out of the report          |
| `ZORA_CREATOR_WATCHLIST`      | empty   | Comma-separated creator handles or addresses |

The schedule is every 30 minutes. Leave `autostart` off until the watchlist looks right.

## Commands

```bash
node scripts/run.mjs
zora explore --sort featured --type creator-coin --limit 8 --json
zora explore --sort trending --type creator-coin --limit 8 --json
zora explore --sort volume --type creator-coin --limit 8 --json
zora get <identifier> --type creator-coin --json
```

## How It Works

Three creator views are pulled through the CLI. The script filters the rows and stores featured creator ids plus watchlist metrics in `~/.config/zora-agent-skills/creator-pulse/state.json`.

With a watchlist set, each identifier gets looked up via `zora get --type creator-coin --json`. Volume moves of 10% or more and holder swings of 25+ trigger alerts. New entries into the featured view between runs are flagged too.

## Example Output

```text
Creator Pulse
Run at 2026-03-23T13:30:00Z

Featured creators:
1. jacob, $8.1M, $1.2M volume, 2,341 holders
2. alysaliu, $4.2M, $890.3K volume, 1,890 holders

Watchlist alerts:
- jacob volume moved +14.8% since the last run
- alysaliu holder count moved +67
```

## Troubleshooting

Lookup failing? Try the coin contract address. Names work most of the time, but addresses never miss.

Too noisy? Raise the volume floor or shorten the watchlist. This skill works best with a handful of creators, not a directory.

Rate-limit errors mean you should slow the schedule or add an API key.

## Important Notes

- This skill is read-only. It never calls `buy` or `sell`.
- Watchlist alerts depend on local state. Clearing the state file resets the baseline.
- Creator Pulse focuses on creator coins. It does not monitor trend or post coins.
- Use a short watchlist. The best output is a handful of creators, not a directory.
- Use the Zora CLI for all market data. Do not scrape zora.co or call Zora APIs directly.
