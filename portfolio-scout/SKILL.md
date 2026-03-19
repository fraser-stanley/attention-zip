---
name: portfolio-scout
description: Check your local wallet's Zora coin holdings. Use when your human asks about their portfolio, coin balances, or holdings value.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Portfolio Scout"
  difficulty: "beginner"
---

# Portfolio Scout

Check your local wallet's Zora coin holdings. The read-only check before you trade.

## When to Use This Skill

Use when the user says:
- "Check my Zora holdings"
- "What coins do I have?"
- "Show my portfolio"
- "How much is my wallet worth?"

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli`
2. Create or import a wallet: `zora setup`
3. (Optional) Configure an API key to reduce rate limiting: `zora auth configure`

## Configuration

| Setting | Flag | Default | Description |
|---------|------|---------|-------------|
| Sort | `--sort` | `balance` | Sort by: `balance`, `value`, `mcap`, `change` |

## Commands

```bash
zora balances --json                  # all coin holdings
zora balances --sort value --json     # sorted by USD value (highest first)
zora balances --sort change --json    # sorted by 24h change
```

## How It Works

1. Run `zora balances --json` to fetch all coin holdings from the local wallet
2. Parse each holding: coin name, symbol, type, balance, USD value, market cap, 24h volume
3. Present holdings with name, type, token balance, USD value, and 24h change
4. Show total portfolio value as a sum of all holdings

## Example Output

```
Coin Holdings (local wallet):

1. jacob (CREATOR) — 1,200 tokens
   Value: $4,120 | +8.3% 24h

2. looksmaxxing (CONTENT) — 500 tokens
   Value: $1,150 | +12.1% 24h

3. based penguin (CONTENT) — 2,000 tokens
   Value: $780 | -3.2% 24h

Total value: ~$6,050
Coins held: 3
```

## Troubleshooting

**"No wallet configured"**
- Run `zora setup` to create a new wallet or import an existing private key.

**"Balance shows nothing but I have tokens"**
- `zora balances` shows **Zora coin holdings only** — NOT native ETH, USDC, or ZORA token balances. If the user asks about native tokens, explain this limitation.

**"Can I check another wallet?"**
- `zora balances` has no address argument. It reads from the local wallet at `~/.config/zora/wallet.json` only. For arbitrary address lookups, use the API route: `GET /api/agents/<address>`.

## Important Notes

- Wallet-only: reads from `~/.config/zora/wallet.json` or `ZORA_PRIVATE_KEY` env var. No address argument.
- Returns coin holdings (balance, USD value, market cap, volume per coin), not native ETH/USDC/ZORA.
- Bankr-compatible: point Bankr agents at a wallet address via the API route for cross-agent portfolio checks.
- This skill is the "check before you trade" step for execution skills like Momentum Trader.
