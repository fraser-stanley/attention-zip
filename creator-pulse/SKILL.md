---
name: creator-pulse
description: Creator coin ecosystems, featured creators, and watchlists on Zora.
version: 0.1.0
metadata:
  openclaw:
    emoji: "🎨"
    homepage: https://github.com/fraser-stanley/zora-agent-skills
---

# Creator Pulse

Track creator coins and featured creators on Zora. Build a watchlist, spot volume spikes, and monitor holdings changes for specific creators.

## Data available

- Creator coin listings (all creator-type coins)
- Featured creators (Zora-curated)
- Individual coin detail (by address)
- Holder counts and volume for any coin

## How to use

All data comes from the Zora Agent Skills API. Base URL depends on deployment — use the `api` field from `/.well-known/ai.json`.

### Endpoints

**Creator coins**
```
GET /api/explore?sort=creators&count=10
```

**Featured creators**
```
GET /api/explore?sort=featured&count=10
```

Parameters:
- `sort` — required: `creators` or `featured`
- `count` — optional, 1–20, default 10

### Response shape

```json
{
  "coins": [
    {
      "name": "jacob",
      "address": "0xaaaa...bbbb",
      "symbol": "JACOB",
      "coinType": "CREATOR",
      "marketCap": "8100000",
      "volume24h": "1200000",
      "marketCapDelta24h": "-283500",
      "creatorAddress": "0xcccc...dddd",
      "uniqueHolders": 2341
    }
  ],
  "sort": "creators",
  "count": 10
}
```

Fields per coin:
- `name` — display name
- `address` — contract address on Base (chain 8453)
- `symbol` — ticker
- `coinType` — `CREATOR` for creator coins
- `marketCap` — USD string
- `volume24h` — USD string
- `marketCapDelta24h` — absolute USD change in market cap over 24h
- `creatorAddress` — the creator's wallet
- `uniqueHolders` — number of unique holders

To compute percentage change: `delta / (marketCap - delta) * 100`.

## Watchlist pattern

To monitor specific creators, fetch the full creator list and filter by `creatorAddress` or `name`. Compare `volume24h` and `marketCapDelta24h` across checks to detect spikes.

## Example

**Prompt:** Show me the top featured creators on Zora and any recent activity on my watchlist.

**Response:**

Featured creators update:

1. jacob (creator-coin) — $8.1M mcap, -3.4% 24h
   Holders: 2,341 | Volume: $1.2M

2. alysaliu (creator-coin) — $4.2M mcap, +5.7% 24h
   Holders: 1,890 | Volume: $890.3K

Watchlist alert:
⚠ jacob saw a 15% volume increase in the last hour.

## Scope

Read-only. No wallet, keys, or transactions. All data is public on-chain data fetched through the Zora protocol SDK.
