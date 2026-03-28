---
name: copy-trader
description: Mirror public Zora wallet moves from selected source wallets and optional leaderboard traders. Use when your human wants a dry-run-first execution skill that confirms recent swaps, enforces freshness and price-drift gates, and mirrors entries, trims, and exits from a dedicated wallet.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Copy Trader"
  difficulty: "advanced"
---

# Copy Trader

Copy Trader is a managed execution skill for the Zora attention market. It follows selected public wallets, confirms recent swaps, and mirrors buys, trims, and exits with freshness gates and audit logs. Dry-run mode is the default.

## When to Use This Skill

Use this skill when the user asks for:

- A copytrade loop driven by public Zora wallet activity
- Manual source-wallet following with optional leaderboard imports
- Dry-run checks before copied trades go live
- Proportional mirrored exits when a followed wallet trims or closes

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`.
3. Run `./scripts/validate.sh`.
4. Keep `ZORA_COPYTRADE_LIVE=false` until the dry-run output matches the sources you want.
5. If you create the wallet locally on macOS, run `zora wallet backup` before you trust this skill with live funds.

## Configuration

| Env | Default | Description |
| --- | --- | --- |
| `ZORA_COPYTRADE_LIVE` | `false` | Turns real copying on |
| `ZORA_COPYTRADE_SOURCE_ADDRESSES` | `""` | Comma-separated wallets or handles to follow |
| `ZORA_COPYTRADE_IMPORT_LEADERBOARD` | `false` | Pull extra sources from the Zora leaderboard |
| `ZORA_COPYTRADE_LEADERBOARD_COUNT` | `3` | Number of leaderboard traders to import |
| `ZORA_COPYTRADE_SPEND_TOKEN` | `eth` | Asset used for copied buys |
| `ZORA_COPYTRADE_EXIT_TOKEN` | `eth` | Asset received on copied sells |
| `ZORA_COPYTRADE_MAX_BUY_USD` | `25` | Cap per copied buy |
| `ZORA_COPYTRADE_DAILY_CAP_USD` | `100` | Spend cap per rolling day |
| `ZORA_COPYTRADE_MAX_POSITIONS` | `5` | Max copied positions tracked at once |

The ClawHub UI only exposes the primary controls above. Advanced env overrides still work if you need to tune freshness, drift, concentration, or confirmation behavior manually. The worker runs every minute, but live mode stays selective. It confirms the source swap, checks its age, compares the current quote with the source price, and only then decides whether copying is still acceptable.

## Commands

```bash
node scripts/run.mjs
zora buy <address> --usd <amount> --token <asset> --quote --json
zora buy <address> --usd <amount> --token <asset> --slippage <pct> --json --yes
zora sell <address> --percent <pct> --to <asset> --quote --json
zora sell <address> --percent <pct> --to <asset> --slippage <pct> --json --yes
zora balance --json
zora balance coins --sort usd-value --limit 20 --json
```

## How It Works

Each run loads the last source snapshot and local attribution cache, resolves source wallets, optionally imports a short leaderboard list, then fetches current source balances and classifies deltas as entries, adds, trims, or exits.

Before acting, the skill confirms each delta against recent swap activity and measures source age. Exits and trims run before entries. Buys are sized from the source move, then capped by per-trade spend, daily spend, available wallet balance, position count, and concentration rules.

Every trade is quoted first. Live mode only acts when freshness, price drift, and slippage clear their gates. Local state is advisory only, so every run reconciles copied positions against the real wallet before new live entries are allowed.

## Example Output

```text
Copy Trader
Run at 2026-03-27T13:40:00Z
Mode: dry-run
Health: healthy

Sources tracked: 2
- jacob, manual
- reef-X4B2, leaderboard

Confirmed source actions:
- BUY hyperpop from jacob, source age 54s, source $84.00, planned copy $25.00
  Quote: $25.00 -> 263 HYPERPOP, age 54s, drift +3.8%
  Action: dry-run only, no order sent
- SELL moonbag from reef-X4B2 skipped, stale exit, live mode skipped
```

## Troubleshooting

- If no sources are tracked, check `ZORA_COPYTRADE_SOURCE_ADDRESSES` and confirm the handle resolves to a public wallet.
- If snapshot changes are unconfirmed, widen `ZORA_COPYTRADE_CONFIRMATION_LOOKBACK_MIN` before loosening trade caps.
- If entries keep skipping, check freshness, price drift, and quote slippage before you change sizing.
- If live sells fail, re-run in dry-run mode and inspect copied-position state plus reconcile notes.
- If the skill reports state recovery or reconciliation mismatch, treat that as a safety event and fix the wallet/state mismatch first.

## Important Notes

- This skill can place real trades. Treat live mode as production.
- Dry-run is the default and should stay the default for new installs.
- Copy Trader only follows public Zora activity on Base.
- The one-minute heartbeat does not promise instant fills. Freshness and price-drift gates exist to keep late copies from becoming bad copies.
- The journal is part of the safety model. Every action or skip includes a reason.
- Use a dedicated wallet and back it up with `zora wallet backup` on macOS.
