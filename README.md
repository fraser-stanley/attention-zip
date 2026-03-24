# Zora Agent Skills

Managed agent skills for the Zora attention market. Open source, no custody.

## Quick start

```bash
git clone git@github.com:fraser-stanley/zora-agent-skills.git
cd zora-agent-skills
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Skills

Five managed skills. Each skill directory contains:

- `SKILL.md` for agent-facing instructions
- `clawhub.json` for runtime metadata, cron, env, and tunables
- `scripts/run.mjs` as the managed entrypoint
- `scripts/validate.sh` for local validation

| Skill                               | Description                                                             | Type      |
| ----------------------------------- | ----------------------------------------------------------------------- | --------- |
| [trend-scout](trend-scout/)         | Scheduled trend scan with snapshot diffing and watchlist alerts         | Read-only |
| [creator-pulse](creator-pulse/)     | Featured creator scan with watchlist and holder-change alerts           | Read-only |
| [briefing-bot](briefing-bot/)       | Scheduled market digest with optional portfolio overlap                 | Read-only |
| [portfolio-scout](portfolio-scout/) | Wallet-backed portfolio monitor with concentration and drawdown checks  | Read-only |
| [momentum-trader](momentum-trader/) | Dry-run-first momentum loop with quotes, daily caps, and trailing exits | Execution |

Trend Scout, Creator Pulse, and Briefing Bot do not need a wallet. Portfolio Scout and Momentum Trader need a dedicated wallet configured through `zora setup` or `ZORA_PRIVATE_KEY`. If you create that wallet locally on macOS, run `zora wallet backup` after setup.

## API

Agent-facing endpoints. All responses include cache headers.

| Endpoint                    | Description                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /api`                  | Discovery document                                                                               |
| `GET /api/skills`           | Skill catalog (`?id=<skill-id>` for single lookup)                                               |
| `GET /api/explore`          | Live coin data (`?sort=trending\|mcap\|new\|volume\|gainers\|creators\|featured`, `?count=1-20`) |
| `GET /api/leaderboard`      | Weekly trader rankings (`?count=1-50`)                                                           |
| `GET /api/agents/<address>` | Agent profile (balances, coins, volume, rank)                                                    |
| `GET /skills/<id>/skill-md` | Raw SKILL.md content for agent consumption                                                       |
| `GET /.well-known/ai.json`  | Agent discovery metadata                                                                         |

## Project structure

```
trend-scout/           Skill directories (SKILL.md + clawhub.json + scripts/)
creator-pulse/
briefing-bot/
portfolio-scout/
momentum-trader/
src/
├── app/               Pages and API routes
│   ├── api/           Agent-facing endpoints
│   ├── dashboard/     Tabbed explore view
│   ├── skills/        Skill gallery
│   ├── leaderboard/   Weekly trader rankings
│   ├── portfolio/     Portfolio view
│   └── agents/        Agent list and profile pages
├── components/        UI components (nav, tables, skill cards, shadcn/ui)
└── lib/               SDK wrapper, skill data, utilities
```

## Development

```bash
pnpm dev          # dev server at localhost:3000
pnpm typecheck    # direct TypeScript check (tsc --noEmit)
pnpm lint         # eslint
pnpm test         # vitest, including managed skill entrypoint integration
pnpm build        # production build (TypeScript + Next.js compilation)
```

Merge gate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

`pnpm build` remains the primary production verification gate, while `src/__tests__/skill-entrypoints.test.ts` covers the managed `scripts/run.mjs` workers with a stubbed `zora` binary, isolated `HOME`, and state/journal assertions. The per-skill `scripts/validate.sh` checks still require the installed `zora` CLI to be on your shell `PATH`, meaning `command -v zora` and `zora --help` should work, and wallet-backed skills also require a configured wallet.

## Environment

| Variable           | Required        | Description                                                       |
| ------------------ | --------------- | ----------------------------------------------------------------- |
| `ZORA_API_KEY`     | No              | Higher rate limits. Get one at https://zora.co/settings/developer |
| `ZORA_PRIVATE_KEY` | Skill-dependent | Needed for wallet-backed skills and live trading                  |
| `NEXT_PUBLIC_SITE_URL` | No          | Canonical site URL outside Vercel                                 |

Skill-specific env vars and tunables live in each `clawhub.json`. Momentum Trader is dry-run by default and only goes live when `ZORA_MOMENTUM_LIVE=true`.

## Deploy

```bash
vercel
```

For a stakeholder build on Vercel:

- Set `ZORA_API_KEY` for better rate limits. The app still builds and falls back safely without it.
- You do not need `ZORA_PRIVATE_KEY` unless you are testing wallet-backed skills outside the mocked portfolio flow.
- `/dashboard` and `/leaderboard` use live SDK data with mock fallback if upstream data is empty or unavailable.
- The wallet connect flow, portfolio experience, and activity ticker are still mocked intentionally for demo use.

## Documentation

| File                         | Purpose                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)       | Full project reference: architecture, SDK details, CLI commands, key decisions |
| [AGENTS.md](AGENTS.md)       | Agent contributor guide: SDK queries, pitfalls, how to add skills/pages        |
| [TONE.md](TONE.md)           | Copy guidelines and Zora brand principles                                      |
| [LEARNINGS.md](LEARNINGS.md) | Architectural decisions and trade-offs                                         |
| [CHANGELOG.md](CHANGELOG.md) | Release history                                                                |

## Tech stack

Next.js 16, TypeScript (strict), Tailwind CSS v4, shadcn/ui v2, React Query, @zoralabs/coins-sdk, motion/react, Three.js

## License

Private
