---
name: portfolio-scout
description: Read-only wallet balance and coin holdings on Zora.
version: 0.1.0
metadata:
  openclaw:
    emoji: "💼"
    homepage: https://github.com/fraser-stanley/zora-agent-skills
---

# Portfolio Scout

Check any wallet's Zora coin holdings and ETH balance. Uses the same read-only wallet-check pattern Bankr agents already use. No private key needed — just a public wallet address.

## Data available

- Wallet ETH balance
- Coin holdings with current values
- Portfolio composition
- Holdings changes over time (by comparing checks)

## How to use

Portfolio Scout uses the Zora SDK directly. These functions are not yet exposed as API routes — call them through the SDK or use the patterns below.

### SDK functions

**Wallet balances**
```typescript
import { getProfileBalances } from "@zoralabs/coins-sdk";

const response = await getProfileBalances({
  identifier: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  count: 20,
});
```

**Coin holdings**
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

All SDK responses return `{ error, data }`. Always check `response.error` before accessing data.

```typescript
if (response.error) {
  // handle error
}
const balances = response.data;
```

The `data` shape varies by function — extract holdings from the nested `edges` array:

```typescript
const holdings = response.data?.profile?.coinBalances?.edges?.map(e => e.node) ?? [];
```

### What you get back

Each holding includes:
- Coin name and address
- Token balance (amount held)
- Current USD value
- Coin type (TREND, CREATOR, CONTENT)
- 24h price change

## Example

**Prompt:** Check my Zora portfolio at 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.

**Response:**

Portfolio for 0xd8dA...6045

ETH Balance: 2.34 ETH ($7,800)

Coin Holdings:
1. jacob (creator-coin) — 1,200 tokens
   Value: $4,120 | +8.3% 24h

2. looksmaxxing (trend) — 500 tokens
   Value: $1,150 | +12.1% 24h

3. based penguin (trend) — 2,000 tokens
   Value: $780 | -3.2% 24h

Total portfolio: ~$13,850
Coins held: 3

## Bankr compatibility

This skill uses the same read-only wallet lookup pattern as Bankr agents. If you're running a Bankr wallet, point Portfolio Scout at your Bankr wallet address to check holdings. When execution skills ship (buy/sell), Portfolio Scout becomes the "check before you trade" step.

## Scope

Read-only. Requires only a public wallet address — no private key, no signing, no transactions. All data is public on-chain data fetched through the Zora protocol SDK.
