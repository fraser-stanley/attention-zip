---
name: trend-scout
description: Surface trending coins, new launches, and top gainers on Zora. Use when your human asks about momentum, what's trending, new coins, or volume leaders.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Trend Scout"
  difficulty: "beginner"
---

# Trend Scout

Surface trending coins, new launches, and top gainers on Zora before they appear on dashboards.

## When to Use This Skill

Use when the user asks about:
- What's trending on Zora
- New coin launches
- Top gainers or biggest movers
- Volume leaders or volume spikes
- General market momentum

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli`
2. (Optional) Configure an API key to reduce rate limiting: `zora auth configure`
3. No wallet needed. This skill is read-only.

## Configuration

| Setting | Flag | Default | Description |
|---------|------|---------|-------------|
| Sort | `--sort` | `trending` | One of: `trending`, `new`, `gainers`, `volume`, `mcap` |
| Limit | `--limit` | `10` | Results per query (1-20) |
| Type filter | `--type` | `all` | Filter: `all`, `trend`, `creator-coin`, `post` |

## Commands

```bash
zora explore --sort trending --json           # coins ranked by network momentum
zora explore --sort new --json                # recently launched coins
zora explore --sort gainers --json            # top 24h market cap gainers
zora explore --sort volume --json             # highest 24h volume
zora explore --sort trending --limit 5 --json # fewer results
zora get <address> --json                     # detail for a specific coin
```

## How It Works

1. Fetch explore data using the sort that matches the user's question
2. Parse the JSON response — each coin includes name, address, market cap, volume, and 24h delta
3. Rank and present the top results with name, market cap, 24h change, volume, and contract address
4. For deeper info on a specific coin, follow up with `zora get <address>`

## Example Output

```
Found 3 trending coins with notable movement:

1. looksmaxxing (trend) — $2.3M mcap, +12.3% 24h
   Address: 0x1234...5678
   Volume: $450.2K

2. hyperpop (trend) — $950.2K mcap, +22.8% 24h
   Address: 0xabcd...ef01
   Volume: $210.4K

3. based penguin (trend) — $780.5K mcap, +31.2% 24h
   Address: 0x9876...5432
   Volume: $95.6K
```

## Troubleshooting

**"Rate limited" or slow responses**
- Configure an API key: `zora auth configure`
- Without a key, requests are throttled

**Empty results for `--sort gainers`**
- `--sort gainers` only supports `--type post`. Do not combine with `--type all` or `--type creator-coin`

**Exit code 1**
- CLI error. In `--json` mode, errors are structured: `{"error": "...", "suggestion": "..."}`

## Important Notes

- Compute percentage change: `marketCapDelta24h / (marketCap - marketCapDelta24h) * 100`
- All data is public on-chain data on Base (chain 8453). No wallet or keys needed.
- `zora get` returns `uniqueHolders` and `volume24h` but NOT swaps or detailed holder lists.
- `zora get` accepts 0x addresses or creator names, NOT ENS.
