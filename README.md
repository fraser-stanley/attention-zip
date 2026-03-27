# Zora Agent Skills

Agent skills and live market data for the Zora attention market. Scan trends, check portfolios, build briefings, and trade momentum.

## Quick start

```bash
git clone git@github.com:fraser-stanley/zora-agent-skills.git
cd zora-agent-skills
pnpm install
pnpm dev
```

Open http://localhost:3000.

If `STAGING_PASSWORD` is set, the app redirects visitor-facing pages to `/login` first.

## Skills

Five skills for the Zora market. Each skill directory contains:

- `SKILL.md` for agent-facing instructions
- `clawhub.json` for runtime metadata, cron, env, and tunables
- `scripts/run.mjs` as the managed entrypoint
- `scripts/validate.sh` for host-readiness validation

| Skill                               | Description                                                             | Type      |
| ----------------------------------- | ----------------------------------------------------------------------- | --------- |
| [trend-scout](trend-scout/)         | Tracks trend leaders, new entrants, and volume shifts                   | Read-only |
| [creator-pulse](creator-pulse/)     | Tracks creator-coin leaders and watchlist moves                         | Read-only |
| [briefing-bot](briefing-bot/)       | Turns the market into a short briefing                                  | Read-only |
| [portfolio-scout](portfolio-scout/) | Checks balances, position changes, and concentration                    | Read-only |
| [momentum-trader](momentum-trader/) | Quotes and manages momentum trades. Dry run by default                  | Execution |

Trend Scout, Creator Pulse, and Briefing Bot do not need a wallet. Portfolio Scout and Momentum Trader need a dedicated wallet configured through `zora setup` or `ZORA_PRIVATE_KEY`. If you create that wallet locally on macOS, run `zora wallet backup` after setup.

## API

Agent-facing endpoints. All responses include cache headers.

| Endpoint                    | Description                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /api`                  | Discovery document                                                                               |
| `GET /api/skills`           | Skill catalog (`?id=<skill-id>` for single lookup)                                               |
| `GET /api/explore`          | Live coin data (`?sort=trending\|mcap\|new\|volume\|gainers\|creators\|featured`, `?count=1-20`) |
| `GET /api/leaderboard`      | Weekly trader rankings by Zora volume (`?count=1-50`)                                            |
| `GET /api/portfolio`        | Public portfolio lookup (`?address=<0x-address>&count=1-50`)                                     |
| `GET /skills/<id>/skill-md` | Raw SKILL.md content for agent consumption                                                       |
| `GET /llms.txt`             | Short agent-readable docs                                                                        |
| `GET /llms-full.txt`        | Full agent-readable docs                                                                         |
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
│   ├── .well-known/   Dynamic discovery route
│   ├── dashboard/     Tabbed explore view
│   ├── skills/        Skill gallery
│   ├── leaderboard/   Weekly trader rankings
│   ├── llms.txt/      Short discovery docs
│   ├── llms-full.txt/ Full discovery docs
│   ├── portfolio/     Portfolio view
│   └── login/         Staging password gate
├── components/        UI components (nav, tables, skill cards, shadcn/ui)
└── lib/               SDK wrapper, discovery builders, skill data, utilities
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

`pnpm build` remains the primary production verification gate, while `src/__tests__/skill-entrypoints.test.ts` covers the managed `scripts/run.mjs` workers with a stubbed `zora` binary, isolated `HOME`, and state/journal assertions. Run each skill's `./scripts/validate.sh` from inside that skill directory. Those checks still require the installed `zora` CLI to be on your shell `PATH`, and wallet-backed skills also require a configured wallet.

## Environment

| Variable                    | Required        | Description                                                          |
| --------------------------- | --------------- | -------------------------------------------------------------------- |
| `ZORA_API_KEY`              | No              | Higher rate limits. Get one at https://zora.co/settings/developer    |
| `ZORA_PRIVATE_KEY`          | Skill-dependent | Needed for wallet-backed skills and live trading                     |
| `STAGING_PASSWORD`          | No              | Enables the custom app-level password gate for visitor pages         |
| `NEXT_PUBLIC_SITE_URL`      | No              | Canonical site URL for metadata, sitemap, and install prompts        |
| `NEXT_PUBLIC_SITE_REPO_URL` | No              | Public repo URL used in skill source links and manual clone commands |
| `NEXT_PUBLIC_SITE_REPO_REF` | No              | Repo ref used for source links, defaults to `main`                   |
| `ALLOW_MOCK_MARKET_DATA`    | No              | Set to `true` only if you intentionally want mock market fallback    |

Skill-specific env vars and tunables live in each `clawhub.json`. Momentum Trader is dry-run by default and only goes live when `ZORA_MOMENTUM_LIVE=true`.

## Deploy

```bash
vercel
```

For a stakeholder build on Vercel:

- Set `ZORA_API_KEY` for better rate limits. The app still builds safely without it.
- Set `STAGING_PASSWORD` if the deployment should stay behind the repo's custom password gate. This protects visitor-facing pages at `/login` because the project cannot use Vercel's native password protection on the current plan.
- Set `NEXT_PUBLIC_SITE_URL` when you know the public hostname. The discovery docs are host-aware at runtime, but canonical metadata should still use the intended site URL.
- Set `NEXT_PUBLIC_SITE_REPO_URL` and `NEXT_PUBLIC_SITE_REPO_REF` when the public skills repo is ready.
- You do not need `ZORA_PRIVATE_KEY` unless you are testing wallet-backed skills or live trading flows.
- `/dashboard` and `/leaderboard` use live SDK data. Mock fallback is disabled in production unless `ALLOW_MOCK_MARKET_DATA=true` is set intentionally.
- The wallet connect flow is address-only. Users paste the address from their local Zora CLI wallet. The activity ticker remains illustrative until real trade activity is wired in.
- Agent-facing routes stay public when the gate is on: `/api`, `/api/*`, `/skills/<id>/skill-md`, `/.well-known/ai.json`, and static public files.

## Documentation

| File                         | Purpose                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)       | Full project reference: architecture, SDK details, CLI commands, key decisions |
| [AGENTS.md](AGENTS.md)       | Agent contributor guide: SDK queries, pitfalls, how to add skills/pages        |
| [TONE.md](TONE.md)           | Copy guidelines, market-first framing, and Zora brand principles               |
| [LEARNINGS.md](LEARNINGS.md) | Architectural decisions and trade-offs                                         |
| [CHANGELOG.md](CHANGELOG.md) | Release history                                                                |

## Tech stack

Next.js 16, TypeScript (strict), Tailwind CSS v4, shadcn/ui v2, React Query, @zoralabs/coins-sdk, motion/react, Three.js

## License

Private
