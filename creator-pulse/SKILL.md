---
name: creator-pulse
description: Track creator coin ecosystems and featured creators on Zora. Use when your human asks about specific creators, creator coins, or wants a watchlist.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Creator Pulse"
  difficulty: "beginner"
---

# Creator Pulse

Track creator coin ecosystems and featured creators on Zora. Monitor volume spikes and holdings changes for specific creators.

## When to Use This Skill

Use when the user asks about:
- A specific creator or their coin
- Featured or top creators on Zora
- Creator coin rankings by market cap or volume
- Watchlist tracking for creators they follow

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli`
2. (Optional) Configure an API key to reduce rate limiting: `zora auth configure`
3. No wallet needed. This skill is read-only.

## Configuration

| Setting | Flag | Default | Description |
|---------|------|---------|-------------|
| Limit | `--limit` | `10` | Results per query (1-20) |
| Type | `--type` | `creator-coin` | Filter to creator coins |
| Sort | `--sort` | `mcap` | One of: `mcap`, `volume`, `featured` |

## Commands

```bash
zora explore --type creator-coin --json                          # all creator coins by market cap
zora explore --sort featured --type creator-coin --json          # Zora-curated featured creators
zora explore --sort volume --type creator-coin --limit 5 --json  # top volume creator coins
zora get <creator-name> --json                                   # lookup by creator name
zora get <address> --type creator-coin --json                    # lookup by contract address
```

## How It Works

1. Fetch creator coins using the appropriate sort and type filter
2. Present each creator coin with name, market cap, holder count, 24h volume, and 24h change
3. For watchlist alerts, compare `marketCapDelta24h` and `volume24h` between checks to detect spikes
4. Drill into a specific creator with `zora get` for detailed stats

## Example Output

```
Featured creators update:

1. jacob (creator-coin) — $8.1M mcap, -3.4% 24h
   Holders: 2,341 | Volume: $1.2M

2. alysaliu (creator-coin) — $4.2M mcap, +5.7% 24h
   Holders: 1,890 | Volume: $890.3K

Watchlist alert:
⚠ jacob saw a 15% volume increase in the last hour.
```

## Troubleshooting

**No results for a creator name**
- `zora get` accepts creator names or 0x addresses. ENS names are not supported.

**Missing holder or swap data**
- `zora get` returns `uniqueHolders` and `volume24h` but NOT a swap list or holder breakdown. Do not promise detailed holder analytics.

**`--sort featured` returns error with certain types**
- `--sort featured` supports `--type creator-coin` and `--type post` only.

## Important Notes

- To build a watchlist, fetch the full list periodically and compare `volume24h` and `marketCapDelta24h` across checks.
- Compute percentage change: `marketCapDelta24h / (marketCap - marketCapDelta24h) * 100`
- All data is public on-chain data. No wallet or keys needed.
