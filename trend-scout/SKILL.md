---
name: trend-scout
description: Trending coins, new launches, gainers, and momentum on Zora.
version: 0.1.0
metadata:
  openclaw:
    emoji: "📡"
    homepage: https://github.com/fraser-stanley/zora-agent-skills
---

# Trend Scout

Spot fast-moving coins on Zora before they show up on dashboards. Returns structured data — coin name, address, market cap, volume, and 24h change — so you can rank, filter, and act on momentum.

## Data available

- Trending coins (network-wide momentum)
- New coin launches
- Top gainers by 24h market cap change
- Top volume coins (24h)

## How to use

All data comes from the Zora Agent Skills API. Base URL depends on deployment — use the `api` field from `/.well-known/ai.json`.

### Endpoints

**Trending coins**
```
GET /api/explore?sort=trending&count=10
```

**New launches**
```
GET /api/explore?sort=new&count=10
```

**Top gainers (24h)**
```
GET /api/explore?sort=gainers&count=10
```

**Top volume (24h)**
```
GET /api/explore?sort=volume&count=10
```

Parameters:
- `sort` — required: `trending`, `new`, `gainers`, or `volume`
- `count` — optional, 1–20, default 10

### Response shape

```json
{
  "coins": [
    {
      "name": "looksmaxxing",
      "address": "0x1234...5678",
      "symbol": "LOOKS",
      "coinType": "TREND",
      "marketCap": "2300000",
      "volume24h": "450200",
      "marketCapDelta24h": "252000",
      "creatorAddress": "0xabcd...ef01",
      "uniqueHolders": 342
    }
  ],
  "sort": "trending",
  "count": 10
}
```

Fields per coin:
- `name` — display name
- `address` — contract address on Base (chain 8453)
- `symbol` — ticker
- `coinType` — `TREND`, `CREATOR`, or `CONTENT`
- `marketCap` — USD string
- `volume24h` — USD string
- `marketCapDelta24h` — absolute USD change in market cap over 24h
- `creatorAddress` — wallet that created the coin
- `uniqueHolders` — number of unique holders

To compute percentage change: `delta / (marketCap - delta) * 100`.

## Example

**Prompt:** Check Zora for trending coins with significant price movement in the last 24 hours.

**Response:**

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

## Scope

Read-only. No wallet, keys, or transactions. All data is public on-chain data fetched through the Zora protocol SDK.
