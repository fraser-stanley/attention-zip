---
name: briefing-bot
description: Runs a compact market digest on a schedule. Covers trends, volume, new launches, gainers, and portfolio overlap.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.0"
  displayName: "Briefing Bot"
  difficulty: "intermediate"
---

# Briefing Bot

Rolls trending, volume, new launches, gainers, and portfolio overlap into one short report.

## When to Use This Skill

Use this skill when the user asks for:

- A morning or evening Zora briefing
- One market summary instead of running several commands
- A check-in that includes portfolio overlap

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli` (requires Node.js 20+) and make sure `node` is available.
2. Run `./scripts/validate.sh`.
3. If a wallet is configured, the skill includes held-coin overlap. If not, it still runs.
4. The schedule is twice daily. Trigger it manually first.

## Configuration

| Env                               | Default | Description                        |
| --------------------------------- | ------- | ---------------------------------- |
| `ZORA_BRIEFING_LIMIT`             | `5`     | Rows fetched per market scan       |
| `ZORA_BRIEFING_INCLUDE_PORTFOLIO` | `true`  | Toggles the wallet overlap section |

The default schedule is `0 9,21 * * *`. Adjust it if your agent already has another cadence.

## Commands

```bash
node scripts/run.mjs
zora explore --sort trending --limit 5 --json
zora explore --sort volume --limit 5 --json
zora explore --sort new --limit 5 --json
zora explore --sort gainers --limit 5 --json
zora balance --json
zora price-history <identifier> --interval 1w --json
```

## How It Works

Four market scans run through the CLI. The ids from each table go into `~/.config/zora-agent-skills/briefing-bot/state.json`. Next run, the `new` table is compared against the previous snapshot so the briefing can say what launched since last time.

When `ZORA_BRIEFING_INCLUDE_PORTFOLIO=true`, the script also runs `zora balance --json`. No wallet configured? The briefing still runs and notes the overlap check was skipped.

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

Portfolio section failing? Disable it and fix the wallet separately. A briefing that skips the wallet is better than one that does not run.

Report feels repetitive? Widen the schedule or increase the scan limit. Quiet markets on tight schedules will naturally look similar.

`new` section empty? The comparison is against the local snapshot, not a global launch index.

## Important Notes

- Briefing Bot is read-only.
- The script runs once per schedule, not as a long-lived process.
- The saved snapshot is local. Moving runtimes moves the baseline too.
- Keep it short. A briefing, not a wall of data.
- Do not return raw JSON. The useful output is the synthesized text.
- `zora balance` reads the local wallet only. No wallet means no portfolio section.
- Use the Zora CLI for all market data. Do not scrape zora.co or call Zora APIs directly.
