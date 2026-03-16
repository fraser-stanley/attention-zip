---
name: briefing-bot
description: Structured morning/evening Zora market digest.
version: 0.1.0
metadata:
  openclaw:
    emoji: "📋"
    homepage: https://github.com/fraser-stanley/zora-agent-skills
---

# Briefing Bot

Pull trending, volume, creator, and new-launch data into a short briefing. Returns a structured digest instead of raw numbers — useful when you want a summary without checking dashboards.

## Data available

- Market-wide trends
- Volume leaders
- New launches
- Creator coin movements
- Leaderboard changes (top traders)

## How to use

A briefing combines multiple API calls into one summary. Fetch all data sources, then format as a digest.

### Endpoints to call

**Trending coins**
```
GET /api/explore?sort=trending&count=5
```

**Top volume**
```
GET /api/explore?sort=volume&count=5
```

**New launches**
```
GET /api/explore?sort=new&count=5
```

**Creator coins**
```
GET /api/explore?sort=creators&count=5
```

**Trader leaderboard**
```
GET /api/leaderboard?count=5
```

Parameters:
- `sort` — see above per endpoint
- `count` — optional, 1–20 for explore, 1–50 for leaderboard

### Response shapes

**Explore response** (same for all sort types):
```json
{
  "coins": [
    {
      "name": "string",
      "address": "string",
      "symbol": "string",
      "coinType": "TREND | CREATOR | CONTENT",
      "marketCap": "string (USD)",
      "volume24h": "string (USD)",
      "marketCapDelta24h": "string (USD delta)"
    }
  ],
  "sort": "string",
  "count": 10
}
```

**Leaderboard response**:
```json
{
  "traders": [
    {
      "address": "string",
      "volume": "string (USD)"
    }
  ],
  "count": 5
}
```

### Briefing structure

Combine the results into sections:

1. **Trending** — top coin by market cap, notable movers
2. **New launches** — count of new coins, largest by market cap
3. **Volume leaders** — highest 24h volume, direction
4. **Creator coins** — notable creator coin activity
5. **Leaderboard** — top trader, weekly volume
6. **Assessment** — one sentence: unusual activity or normal market

## Example

**Prompt:** Give me my morning Zora briefing.

**Response:**

Zora Morning Briefing — Mar 14, 2026

Trending: "looksmaxxing" leads at $2.3M mcap (+12.3%).
3 new coins launched overnight, largest at $45K mcap.

Volume leaders: "frog market" at $3.1M 24h vol (-8.1%).
Creator coins: jacob steady at $8.1M, alysaliu up 5.7%.

Leaderboard: 0xd8dA...6045 climbed to #3 with $42K weekly volume.

Nothing unusual detected. Market is moderately active.

## Scope

Read-only. No wallet, keys, or transactions. All data is public on-chain data fetched through the Zora protocol SDK.
