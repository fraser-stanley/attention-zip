---
name: briefing-bot
description: Generate a structured morning or evening Zora market digest. Use when your human asks for a briefing, market summary, or wants to know what changed since their last check.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Briefing Bot"
  difficulty: "beginner"
---

# Briefing Bot

Generate a structured morning or evening Zora market digest from a single prompt.

## When to Use This Skill

Use when the user says:
- "Give me my morning briefing"
- "What changed on Zora since yesterday?"
- "Market summary"
- "What's happening on Zora right now?"

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli`
2. Configure an API key (recommended — this skill runs 5 CLI calls per digest): `zora auth configure`
3. No wallet needed. This skill is read-only.

## Configuration

| Setting | Flag | Default | Description |
|---------|------|---------|-------------|
| Limit per section | `--limit` | `5` | Coins per section (1-10) |

## Commands

Run all five, then synthesize:

```bash
zora explore --sort trending --limit 5 --json     # trending coins
zora explore --sort volume --limit 5 --json        # volume leaders
zora explore --sort new --limit 5 --json           # new launches
zora explore --sort gainers --limit 5 --json       # top gainers
zora explore --type creator-coin --limit 5 --json  # creator coin activity
```

## How It Works

1. Run all 5 explore commands to gather data across market dimensions
2. Combine the results into a single briefing with these sections:
   - **Trending** — top coin by market cap, notable movers
   - **New launches** — count of new coins, largest by market cap
   - **Volume leaders** — highest 24h volume, direction
   - **Top gainers** — biggest 24h market cap increases
   - **Creator coins** — notable creator coin activity
3. End with a one-sentence market assessment
4. Keep the entire briefing under 200 words. Omit sections with no notable data rather than padding.

## Example Output

```
Zora Morning Briefing — Mar 14, 2026

Trending: "looksmaxxing" leads at $2.3M mcap (+12.3%).
3 new coins launched overnight, largest at $45K mcap.

Volume leaders: "frog market" at $3.1M 24h vol (-8.1%).
Top gainers: "hyperpop" up 22.8% to $950K mcap.
Creator coins: jacob steady at $8.1M, alysaliu up 5.7%.

Nothing unusual detected. Market is moderately active.
```

## Troubleshooting

**Rate limited during briefing**
- This skill runs 5 sequential CLI calls. Without an API key, rate limits are likely. Configure one: `zora auth configure`

**Empty sections**
- Some sorts may return no results during quiet market periods. Omit empty sections from the briefing.

**`--sort gainers` errors**
- `--sort gainers` only supports `--type post`. The briefing uses it without a type filter, which defaults to post.

## Important Notes

- The CLI has no streaming mode. Each call is a single request-response.
- Do not return raw JSON to the user. Synthesize into prose.
- End every briefing with a plain-language assessment: "Market is [quiet/active/volatile]. [Notable signal or 'Nothing unusual.']"
