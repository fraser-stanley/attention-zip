---
name: creator-pulse
description: Run a managed creator-coin watchlist on Zora. Use when your human wants recurring updates on featured creators, creator-coin momentum, or watchlist changes without trading.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.0"
  displayName: "Creator Pulse"
  difficulty: "intermediate"
---

# Creator Pulse

Creator Pulse is a managed creator-coin watcher. It scans featured, trending, and top-volume creator coins, then checks named creators or addresses against the previous run.

## When to Use This Skill

Use this skill when the user asks for:

- Featured creator updates
- A recurring creator-coin watchlist
- Alerts on volume or holder-count changes
- A short report on which creators are gaining traction
- A read-only creator workflow before doing trades or research

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Run `./scripts/validate.sh` in this folder.
3. Set `ZORA_CREATOR_WATCHLIST` if you want per-creator alerts.
4. An API key is optional. It helps if you run the skill on a tight cron.

## Configuration

| Env                           | Default | Description                                  |
| ----------------------------- | ------- | -------------------------------------------- |
| `ZORA_CREATOR_LIMIT`          | `8`     | Number of rows fetched per creator view      |
| `ZORA_CREATOR_MIN_VOLUME_USD` | `0`     | Filters thin rows out of the report          |
| `ZORA_CREATOR_WATCHLIST`      | empty   | Comma-separated creator handles or addresses |

The manifest schedules the skill every 30 minutes. Leave `autostart` off until the watchlist looks right.

## Commands

```bash
node scripts/run.mjs
zora explore --sort featured --type creator-coin --limit 8 --json
zora explore --sort trending --type creator-coin --limit 8 --json
zora explore --sort volume --type creator-coin --limit 8 --json
zora get <handle-or-address> --type creator-coin --json
```

## How It Works

The entrypoint pulls three creator views through the CLI, filters the rows, and stores the featured creator ids plus the latest watchlist metrics in `~/.config/zora-agent-skills/creator-pulse/state.json`.

When a watchlist is configured, it resolves each handle or address through `zora get --type creator-coin --json`. The runtime compares the new values against the saved state and alerts when volume moves by at least 10% or holder count moves by at least 25 accounts. It also flags creators that enter the featured view between runs.

This is a template. The default thresholds are conservative so the report stays readable. Remix it by changing the watchlist, the alert thresholds inside `scripts/run.mjs`, or the output format that gets handed to the human.

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

If a handle lookup fails, try the coin contract address. Address lookups are stricter and avoid ambiguity.

If the report is too noisy, raise the volume floor or shorten the watchlist. Creator Pulse works best when it tracks a small set of creators with real intent.

If the CLI starts returning rate-limit errors, slow the cron or add an API key.

## Important Notes

- This skill is read-only. It never calls `buy` or `sell`.
- Watchlist alerts depend on local state. Clearing the state file resets the baseline.
- Creator Pulse focuses on creator coins. It does not try to monitor trend or post coins.
- Use a short watchlist. The best output is a handful of creators, not a directory.
