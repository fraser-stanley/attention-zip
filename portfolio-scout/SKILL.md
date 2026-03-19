---
name: portfolio-scout
description: Coin holdings and portfolio value on Zora.
version: 0.2.0
metadata:
  openclaw:
    emoji: "💼"
    homepage: https://github.com/fraser-stanley/zora-agent-skills
---

# Portfolio Scout

Check Zora coin holdings via the CLI (local wallet) or the SDK (any wallet address). Uses the same read-only wallet-check pattern Bankr agents already use.

## Data available

- Coin holdings with current values
- Portfolio composition
- Holdings changes over time (by comparing checks)

## How to use

### CLI — local wallet

If you have a wallet configured via `zora setup`, check your own holdings:

```
zora balances --json
```

Returns an array of coin holdings with balance, USD value, market cap, and volume per coin. Local wallet only — no address argument.

### SDK — any wallet

For arbitrary wallet lookups, use the SDK directly:

**Coin balances**
```typescript
import { getProfileBalances } from "@zoralabs/coins-sdk";

const response = await getProfileBalances({
  identifier: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  count: 20,
});
```

**Created coins**
```typescript
import { getProfileCoins } from "@zoralabs/coins-sdk";

const response = await getProfileCoins({
  identifier: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  count: 20,
});
```

Parameters:
- `identifier` — the wallet address to look up (public address, not a private key)
- `count` — number of results, default 20

### Response handling

**CLI** returns clean JSON to stdout:
```json
[{ "name": "Test Coin", "symbol": "TEST", "coinType": "CONTENT", "address": "0x...", "balance": "12.34", "usdValue": 18.51, "priceUsd": 1.5, "marketCap": 1000000, "volume24h": 1200 }]
```

**SDK** responses return `{ error, data }`. Always check `response.error` before accessing data.

```typescript
if (response.error) {
  // handle error
}
const holdings = response.data?.profile?.coinBalances?.edges?.map(e => e.node) ?? [];
```

### What you get back

Each holding includes:
- Coin name, symbol, and address
- Token balance (amount held)
- Current USD value
- Coin type (CONTENT, CREATOR, TREND)
- Market cap and 24h volume

## Example

**Prompt:** Check my Zora coin holdings.

**Response:**

Coin Holdings (local wallet):

1. jacob (CREATOR) — 1,200 tokens
   Value: $4,120 | +8.3% 24h

2. looksmaxxing (CONTENT) — 500 tokens
   Value: $1,150 | +12.1% 24h

3. based penguin (CONTENT) — 2,000 tokens
   Value: $780 | -3.2% 24h

Total value: ~$6,050
Coins held: 3

## Bankr compatibility

This skill uses the same read-only wallet lookup pattern as Bankr agents. If you're running a Bankr wallet, point Portfolio Scout at your Bankr wallet address via the SDK to check holdings. Portfolio Scout is the "check before you trade" step for execution skills like Momentum Trader.

## Scope

Read-only. The CLI reads from your local wallet config but does not sign or transact. SDK lookups require only a public wallet address. All data is public on-chain data fetched through the Zora protocol.
