# Zora Agent Skills

Discover, install, and monitor Zora-native agent skills. Live market data, verified skill gallery, and public leaderboards.

- Live dashboard with trending coins, volume leaders, and creator coins from Zora (Base)
- 4 verified read-only skills for OpenClaw/Bankr-compatible agents
- Coin detail pages with holders, swaps, and market stats
- Weekly trader leaderboard
- One-click install commands for each skill

## Quick start

```bash
git clone git@github.com:fraserstanley/zora-agent-skills.git
cd zora-agent-skills
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Environment (optional)

Create `.env.local` for higher rate limits:

```
ZORA_API_KEY=your_key_here
```

Get a key from https://zora.co/settings/developer. The app works without one.

## Project structure

```
src/
├── app/           Pages and API routes
│   ├── api/       Server-side SDK wrappers (explore, coin, leaderboard)
│   ├── dashboard/ Tabbed explore view (6 sort options)
│   ├── skills/    Skill gallery with install commands
│   ├── coin/      Coin detail pages
│   ├── leaderboard/
│   └── trust/     Trust & Safety
├── components/    UI components (nav, tables, cards, shadcn/ui)
└── lib/           SDK wrapper, skill data, utilities
```

## Skills

| Skill | What it does | Risk |
|-------|-------------|------|
| Trend Scout | Trending coins, new launches, gainers, momentum | Read-only |
| Creator Pulse | Creator coin ecosystems, featured creators, watchlists | Read-only |
| Briefing Bot | Structured morning/evening market digest | Read-only |
| Portfolio Scout | Wallet balance + coin holdings (Bankr-ready) | Read-only |

All skills use the OpenClaw SKILL.md format. No wallet or private key needed.

## Deploy

Deploy to Vercel:

```bash
vercel
```

Set `ZORA_API_KEY` in Vercel environment variables for production.

## Tech stack

Next.js 16, Tailwind CSS v4, shadcn/ui v2, React Query, @zoralabs/coins-sdk

## License

Private
