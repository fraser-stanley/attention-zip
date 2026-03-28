---
name: copy-trader
description: Follows selected public wallets and mirrors their trades with spend caps, freshness checks, and price-drift limits. Dry run by default.
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "Copy Trader"
  difficulty: "advanced"
---

# Copy Trader

Follows selected public wallets, confirms recent swaps, and mirrors buys, trims, and exits. Dry run by default.

## When to Use This Skill

Use this skill when the user asks for:

- A copytrade loop driven by public Zora wallet activity
- Manual source-wallet following with optional leaderboard imports
- Dry-run checks before copied trades go live
- Proportional exits when a followed wallet trims or closes

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`.
3. Run `./scripts/validate.sh`.
4. Keep `ZORA_COPYTRADE_LIVE=false` until the dry-run output matches the sources you want.
5. On macOS, run `zora wallet backup` before trusting this skill with live funds.

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

The default settings show the primary controls above. Advanced overrides for freshness, drift, concentration, and confirmation still work as env vars. The worker runs every minute, but live mode stays selective. It confirms the source swap, checks its age, compares the current quote with the source price, and only copies when conditions pass.

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

The script loads the last source snapshot and attribution cache, looks up source wallets, optionally pulls a short leaderboard list, then fetches current source balances. Deltas are classified as entries, adds, trims, or exits.

Each delta is confirmed against recent swap activity. Source age matters. Exits and trims run before entries. Buy sizing starts from the source move, then gets capped by per-trade spend, daily spend, wallet balance, position count, and concentration limits.

Trades are always quoted first. Live mode acts only when freshness, drift, and slippage all pass. Copied positions get reconciled against the real wallet every run before any new live entries.

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

- No sources tracked? Check `ZORA_COPYTRADE_SOURCE_ADDRESSES` and confirm the handle points to a public wallet.
- Snapshot changes unconfirmed? Widen `ZORA_COPYTRADE_CONFIRMATION_LOOKBACK_MIN` before loosening trade caps.
- Entries keep skipping? Check freshness, price drift, and quote slippage before changing sizing.
- Live sells failing? Re-run in dry-run mode and inspect copied-position state plus reconcile notes.
- Reconciliation mismatch is a safety event. Fix the wallet/state mismatch before doing anything else.

## Important Notes

- This skill can place real trades. Treat live mode as production.
- Dry run is the default and should stay the default for new installs.
- Copy Trader only follows public Zora activity on Base.
- The one-minute schedule does not promise instant fills. Freshness and price-drift checks keep late copies from becoming bad copies.
- The journal is part of the safety model. Every action or skip includes a reason.
- Give it its own wallet. Back it up with `zora wallet backup` on macOS.
