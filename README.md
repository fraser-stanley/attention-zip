# Zora Agent Skills

Agent skills for the Zora attention market. Open source, no custody.

## Quick start

```bash
git clone git@github.com:fraserstanley/zora-agent-skills.git
cd zora-agent-skills
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Skills

Five published skills. Each skill directory contains a `SKILL.md` (agent instructions, OpenClaw format) and `clawhub.json` (runtime config).

| Skill | Description | Type |
|-------|-------------|------|
| [trend-scout](trend-scout/) | Trending topic coins, new trend launches, volume and mcap leaders | Read-only |
| [creator-pulse](creator-pulse/) | Creator coin ecosystems, featured creators, watchlists | Read-only |
| [briefing-bot](briefing-bot/) | Structured morning/evening market digest | Read-only |
| [portfolio-scout](portfolio-scout/) | Coin holdings and portfolio value (local wallet or any address via SDK) | Read-only |
| [momentum-trader](momentum-trader/) | Auto-buys trending Zora coins on momentum signals via Zora CLI | Execution |

Read-only skills need no wallet. Momentum Trader requires a dedicated trader wallet created with `zora setup`.

## API

Agent-facing endpoints. All responses include cache headers.

| Endpoint | Description |
|----------|-------------|
| `GET /api` | Discovery document |
| `GET /api/skills` | Skill catalog (`?id=<skill-id>` for single lookup) |
| `GET /api/explore` | Live coin data (`?sort=trending\|mcap\|new\|volume\|gainers\|creators\|featured`, `?count=1-20`) |
| `GET /api/leaderboard` | Weekly trader rankings (`?count=1-50`) |
| `GET /api/agents/<address>` | Agent profile (balances, coins, volume, rank) |
| `GET /.well-known/ai.json` | Agent discovery metadata |

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
pnpm build        # production build (TypeScript + Next.js compilation)
pnpm test         # vitest (skill structure, data integrity, cross-file sync)
pnpm lint         # eslint
```

`pnpm build` is the primary verification gate.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ZORA_API_KEY` | No | Higher rate limits. Get one at https://zora.co/settings/developer |

Execution skills need `ZORA_API_KEY` and `ZORA_PRIVATE_KEY`. See each skill's `clawhub.json` for required env vars.

## Deploy

```bash
vercel
```

Set `ZORA_API_KEY` in Vercel environment variables.

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](CLAUDE.md) | Full project reference: architecture, SDK details, CLI commands, key decisions |
| [AGENTS.md](AGENTS.md) | Agent contributor guide: SDK queries, pitfalls, how to add skills/pages |
| [TONE.md](TONE.md) | Copy guidelines and Zora brand principles |
| [LEARNINGS.md](LEARNINGS.md) | Architectural decisions and trade-offs |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## Tech stack

Next.js 16, TypeScript (strict), Tailwind CSS v4, shadcn/ui v2, React Query, @zoralabs/coins-sdk, motion/react, Three.js

## License

Private
