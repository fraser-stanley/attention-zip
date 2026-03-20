---
name: momentum-trader
description: Auto-buy trending Zora coins on momentum signals and manage positions via the Zora CLI on Base. Use when your human wants automated momentum trading, trailing stops, or position management.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Momentum Trader"
  difficulty: "advanced"
---

# Momentum Trader

Monitor Zora for momentum signals and execute buys and sells through the Zora CLI on Base.

> This skill executes real trades with real ETH. There are no server-side guardrails or spending limits. Use a dedicated trader wallet only.

## When to Use This Skill

Use when the user asks to:
- Auto-buy trending or gaining coins
- Set up momentum-based trading with entry/exit criteria
- Manage positions with trailing stops
- Snipe new launches or volume spikes

## Setup

1. Install the Zora CLI: `npm install -g @zoralabs/cli`
2. Create a **dedicated trader wallet**: `zora setup --create`
3. Fund the wallet with ETH on Base
4. Configure an API key (required for reliable trading): `zora auth configure`
5. **Dry-run first**: use `--quote` on your first buy to verify setup without spending

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `ZORA_MOMENTUM_MAX_ETH` | 0.01 | Max ETH per trade |
| `ZORA_MOMENTUM_MAX_POSITIONS` | 3 | Concurrent open positions |
| `ZORA_MOMENTUM_MIN_GAIN_PCT` | 15 | Min 24h gain % to trigger entry |
| Max slippage | 3% | Skip if `--quote` slippage exceeds this |
| `ZORA_MOMENTUM_TRAILING_STOP` | 15 | Sell when price drops this % from peak |
| `ZORA_MOMENTUM_COOLDOWN_SEC` | 300 | Seconds between trades |
| `ZORA_MOMENTUM_DAILY_CAP_ETH` | 0.05 | Max total ETH spent per 24h period |

## Commands

**Scanning** (use `--json` global flag):
```bash
zora explore --sort gainers --json            # find momentum candidates
zora explore --sort trending --json           # broader trend scan
zora get <address> --json                     # validate candidate (volume, holders)
zora balances --json                          # check current positions
```

**Trading** (use `-o json` local flag):
```bash
zora buy <address> --quote -o json            # dry-run — ALWAYS do this first
zora buy <address> --eth 0.01 -o json --yes   # execute buy
zora sell <address> --all -o json --yes       # exit full position
zora sell <address> --amount 100 --to USDC -o json --yes  # partial exit to USDC
```

## How It Works

1. **Check limits first**: verify daily spend is under `ZORA_MOMENTUM_DAILY_CAP_ETH` and cooldown has elapsed since last trade
2. Scan gainers and trending coins for candidates meeting entry criteria (min gain %, min volume)
3. Check `zora balances --json` to confirm open positions are under `ZORA_MOMENTUM_MAX_POSITIONS`
4. Validate each candidate with `zora get` — check volume, holder count, coin type
5. Preview the trade with `--quote` to check slippage before committing
6. If slippage is acceptable and all limits pass, execute the buy with `--yes`
7. **Log the trade** to `~/.config/zora/trade-journal.jsonl`: `{"source": "zora:momentum-trader", "action": "buy", "address": "0x...", "eth": 0.01, "timestamp": "..."}`
8. Monitor positions via `zora balances` — track value changes against entry price
9. Exit when trailing stop triggers or take-profit target is hit. Log sells to the journal too.
10. **Wait** `ZORA_MOMENTUM_COOLDOWN_SEC` seconds before scanning again

## Example Output

```
Momentum Trader active — scanning gainers...

Signal detected:
  hyperpop — +28.3% 1h, $210K vol, $950K mcap
  Meets criteria: >15% gain, >$50K volume

Previewing buy (dry-run):
  Estimated: 263 tokens for 0.01 ETH | Slippage: 1.2%

Executing buy:
  Bought 0.01 ETH of hyperpop at $0.00019/token
  Position: 263 tokens | Entry: $0.00019
  Trailing stop set: -15% from peak

Active positions (2/3):
  1. hyperpop — +4.2% since entry, stop at $0.000185
  2. looksmaxxing — +11.8% since entry, stop at $0.000210

Watching for next signal... (cooldown: 5 min)
```

## Troubleshooting

**"Slippage too high"**
- The `--quote` preview showed slippage above the max threshold. Skip and retry after cooldown. Lower-volume coins have higher slippage.

**"No wallet configured"**
- Run `zora setup --create` to create a dedicated trader wallet. Do not use your main wallet.

**Exit code 1 on buy/sell**
- Trade failed. Do not retry immediately. Check the error JSON for details. Common causes: insufficient balance, coin delisted, network congestion.

**"External wallet requires a pre-signed order"**
- `ZORA_PRIVATE_KEY` env var is not set and no wallet file exists. The CLI needs a private key to sign transactions.

## Important Notes

- **buy/sell use `-o json` (local flag)**, not `--json`. Explore, get, and balances use `--json` (global flag).
- `--yes` skips the trade confirmation prompt only. Validation (API key, wallet, balance checks) still runs.
- `--quote` returns estimated token amount and slippage, but no gas estimate.
- `zora sell` supports `--to ETH|USDC|ZORA` for output token selection. Default is ETH.
- Private key stored at `~/.config/zora/wallet.json` (mode 0600). `ZORA_PRIVATE_KEY` env var takes precedence.
- **Kill switch**: remove `ZORA_PRIVATE_KEY` or delete `~/.config/zora/wallet.json` to stop all trading immediately.
- **No server-side guardrails.** The agent enforces caps, cooldowns, and position limits from these instructions. Modified skill = no limits.
- Source tag `zora:momentum-trader` identifies trades from this skill. Other skills should check the journal before selling positions opened here.
