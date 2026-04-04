---
name: briefing-bot
description: Runs a compact market digest on a schedule. Covers trends, volume, new launches, and portfolio overlap.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.0"
  displayName: "Briefing Bot"
  difficulty: "intermediate"
---

# Briefing Bot

Rolls trending, volume, new launches, and portfolio overlap into one short report.

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
| `ZORA_BRIEFING_HISTORY_INTERVAL`  | `1w`    | Price history interval for trend annotation (1h, 24h, 1w, 1m) |

The default schedule is `0 9,21 * * *`. Adjust it if your agent already has another cadence.

## Commands

```bash
node scripts/run.mjs
zora explore --sort trending --type all --limit 5 --json
zora explore --sort volume --type all --limit 5 --json
zora explore --sort new --type all --limit 5 --json
zora balance --json
zora price-history <identifier> --interval 1w --json
```

## How It Works

Three market scans run through the CLI. The ids from each table go into `~/.config/zora-agent-skills/briefing-bot/state.json`. Next run, the `new` table is compared against the previous snapshot so the briefing can say what launched since last time.

After the scans, the script runs `zora price-history <address> --interval 1w --json` on each coin that appears in the trending or volume tables. The JSON `change` field (fractional, e.g. 0.15 = +15%) is used to annotate each coin with a direction and weekly change percentage so the briefing shows whether momentum is sustained or fading.

When `ZORA_BRIEFING_INCLUDE_PORTFOLIO=true`, the script also runs `zora balance --json`. No wallet configured? The briefing still runs and notes the overlap check was skipped.

## Example Output

```text
Zora Briefing
Run at 2026-03-23T09:00:00Z

Trending:
- looksmaxxing, $2.3M mcap, +12.3% 24h, 1w trend: +38.2%
- hyperpop, $890K mcap, +8.1% 24h, 1w trend: -14.5%

Volume:
- frog market, $3.1M volume, 1w trend: +22.0%

New: 3 fresh launches since the last run, largest is $45K.

Portfolio overlap:
- looksmaxxing is both held and trending (1w: +38.2%)

Assessment: Active tape. looksmaxxing momentum is sustained; hyperpop trending but declining — watch for reversal.
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
