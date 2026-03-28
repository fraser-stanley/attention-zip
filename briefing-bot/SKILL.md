---
name: briefing-bot
description: Run a scheduled Zora briefing. Use when your human wants a compact market digest that rolls trending, volume, new launches, gainers, and optional portfolio overlap into one report.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.0"
  displayName: "Briefing Bot"
  difficulty: "intermediate"
---

# Briefing Bot

Briefing Bot is a managed market digest. It runs the core Zora scans, keeps a small local snapshot, and prints a short summary that is easy to read on a schedule.

## When to Use This Skill

Use this skill when the user asks for:

- A morning or evening Zora briefing
- One compact market summary instead of several commands
- A recurring check-in that can mention portfolio overlap
- A short operator note before deeper research or trading

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Run `./scripts/validate.sh`.
3. If the wallet is configured, the skill can include held-coin overlap. If not, it still runs.
4. The manifest uses a twice-daily cron. Trigger it manually first.

## Configuration

| Env                               | Default | Description                        |
| --------------------------------- | ------- | ---------------------------------- |
| `ZORA_BRIEFING_LIMIT`             | `5`     | Rows fetched per market scan       |
| `ZORA_BRIEFING_INCLUDE_PORTFOLIO` | `true`  | Toggles the wallet overlap section |

The default schedule is `0 9,21 * * *`. Adjust it if your agent already has another heartbeat cadence.

## Commands

```bash
node scripts/run.mjs
zora explore --sort trending --limit 5 --json
zora explore --sort volume --limit 5 --json
zora explore --sort new --limit 5 --json
zora explore --sort gainers --limit 5 --json
zora balance --json
```

## How It Works

The entrypoint runs four read-only market scans through the CLI and stores the ids from each table in `~/.config/zora-agent-skills/briefing-bot/state.json`. On the next run it compares the current `new` table against the previous one so it can say what launched since the last report.

If `ZORA_BRIEFING_INCLUDE_PORTFOLIO=true`, the script also attempts `zora balance --json`. That step is optional. If no wallet is configured, the briefing continues and simply notes that the overlap check was skipped.

This is a template. The default output is intentionally short. Remix it by changing the assessment rule, adding creator coverage, or forwarding the finished text into another reporting system.

## Example Output

```text
Zora Briefing
Run at 2026-03-23T09:00:00Z

Trending: looksmaxxing leads at $2.3M, +12.3%.
Volume: frog market leads at $3.1M volume.
New: 3 fresh launches since the last run, largest is $45K.
Gainers: hyperpop leads at +22.8%.

Portfolio overlap:
- looksmaxxing is both held and active in the market scans

Assessment: Active tape. Momentum is broad enough to watch closely.
```

## Troubleshooting

If the portfolio section is failing, disable it first and fix the wallet separately. A briefing that skips the wallet is better than a briefing that does not run.

If the report feels repetitive, widen the cron interval or increase the scan limit. Very short schedules on quiet market days will naturally look similar.

If `new` looks empty, remember that the script compares against its own local snapshot, not a global launch index.

## Important Notes

- Briefing Bot is read-only.
- The entrypoint is meant to be run once per schedule, not as a long-lived daemon.
- The saved snapshot is local. If you move runtimes, you move the baseline too.
- Keep the output under control. The point is a compact briefing, not a wall of market data.
- The CLI has no streaming mode. Each run is a small batch of request-response calls.
- Do not return raw JSON to the human. The useful output is the synthesized briefing.
- `zora balance` is wallet-only. If no wallet is configured, skip the portfolio section cleanly.
- Always use the Zora CLI for market data. Do not scrape zora.co, call Zora APIs directly, or use web search to fetch prices.
