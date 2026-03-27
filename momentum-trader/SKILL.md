---
name: momentum-trader
description: Run a managed momentum loop on Zora. Use when your human wants a dry-run-first execution skill that scans gainers, quotes entries, and manages trailing-stop exits from a dedicated wallet.
metadata:
  author: "Zora Agent Skills"
  version: "2.0.1"
  displayName: "Momentum Trader"
  difficulty: "advanced"
---

# Momentum Trader

Momentum Trader is a managed execution skill. It scans gainers and trending coins, filters them with CLI data, quotes every entry, and stores local position state so later runs can manage exits.

## When to Use This Skill

Use this skill when the user asks for:

- A recurring momentum entry loop
- Dry-run candidate scans before a trade goes live
- Trailing-stop management on a dedicated wallet
- A simple execution template that leans on the Zora CLI instead of custom trade plumbing

## Setup

1. Install the Zora CLI and make sure `node` is available.
2. Use a dedicated wallet. Run `zora setup --create` or set `ZORA_PRIVATE_KEY`. If you create a local wallet on macOS, run `zora wallet backup` before you enable live mode.
3. Run `./scripts/validate.sh`.
4. Leave `ZORA_MOMENTUM_LIVE=false` for the first manual run. This skill starts in dry-run mode by design.

## Configuration

| Env                              | Default | Description                              |
| -------------------------------- | ------- | ---------------------------------------- |
| `ZORA_MOMENTUM_LIVE`             | `false` | Turns real trading on                    |
| `ZORA_MOMENTUM_MAX_ETH`          | `0.01`  | Max ETH per entry                        |
| `ZORA_MOMENTUM_MAX_POSITIONS`    | `3`     | Max tracked positions                    |
| `ZORA_MOMENTUM_MIN_GAIN_PCT`     | `15`    | Minimum 24h change for a candidate       |
| `ZORA_MOMENTUM_MIN_VOLUME_USD`   | `50000` | Minimum 24h volume                       |
| `ZORA_MOMENTUM_MAX_SLIPPAGE_PCT` | `3`     | Passed into quote and live orders        |
| `ZORA_MOMENTUM_TRAILING_STOP`    | `15`    | Exit when price falls this far from peak |
| `ZORA_MOMENTUM_COOLDOWN_SEC`     | `300`   | Delay between trade attempts             |
| `ZORA_MOMENTUM_DAILY_CAP_ETH`    | `0.05`  | Spend limit per rolling day              |

The default cron is every 10 minutes. Keep `autostart` off until the dry-run output looks correct.

## Commands

```bash
node scripts/run.mjs
zora explore --sort gainers --limit 12 --json
zora explore --sort trending --limit 12 --json
zora get <identifier> --json
zora balance coins --sort usd-value --limit 20 --json
zora buy <address> --eth 0.01 --quote --slippage 3 --json
zora buy <address> --eth 0.01 --token eth --slippage 3 --json --yes
zora sell <address> --percent 100 --to eth --slippage 3 --json --yes
```

## How It Works

Each run loads `~/.config/zora-agent-skills/momentum-trader/state.json`, refreshes tracked positions from `zora balance coins`, and updates entry, peak, and current prices. If a tracked coin falls through the trailing-stop rule, the entrypoint quotes or executes a full exit depending on `ZORA_MOMENTUM_LIVE`.

If cooldown, max-position, and daily-cap checks all pass, the skill scans gainers and trending tables, filters for minimum gain and volume, and validates the first passing coin with `zora get`. That step also resolves the coin's contract address, which `buy` and `sell` require. The CLI does not resolve names for trade commands, so the entrypoint always passes a 0x address. It then asks the CLI for a buy quote. Dry-run mode stops there. Live mode sends the real `buy` call and appends the result to `journal.jsonl`.

This is a template. The default alpha is intentionally simple. Swap in a different candidate filter, add a watchlist, or tighten exit logic, but keep the dry-run-first discipline and the journal.

## Example Output

```text
Momentum Trader
Run at 2026-03-23T13:40:00Z
Mode: dry-run

Open positions tracked: 1
- looksmaxxing, entry $0.000210, peak $0.000240, current $0.000230

Candidates:
1. hyperpop, +28.3%, $210K volume
   Quote: 0.01 ETH -> 263 HYPERPOP, slippage 1.2%
   Action: dry-run only, no order sent
```

## Troubleshooting

If the skill never finds candidates, lower `ZORA_MOMENTUM_MIN_GAIN_PCT` or `ZORA_MOMENTUM_MIN_VOLUME_USD`.

If `buy` or `sell` returns "Invalid address", the command received a name instead of a 0x contract address. Use `zora get <name> --json` to resolve the address first, then pass it to the trade command.

If quotes fail, the coin is often too illiquid for the requested size. Reduce `ZORA_MOMENTUM_MAX_ETH` before you loosen slippage.

If live trading is on and the wallet is wrong, stop immediately. Unset `ZORA_MOMENTUM_LIVE` or remove the private key and rerun in dry-run mode.

If you created the wallet locally on macOS, run `zora wallet backup` before you trust this skill with live funds.

## Important Notes

- This skill can place real trades. Treat every live run as production.
- Dry-run is the default and should stay the default for new installs.
- On macOS, back up any locally created trader wallet with `zora wallet backup`.
- The local journal is part of the safety model. Do not remove it if you want auditability.
- Use a dedicated wallet. Do not point this skill at a wallet that other tools trade from casually.
