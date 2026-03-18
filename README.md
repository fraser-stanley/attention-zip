# Zora Agent Skills

Discover, install, and monitor Zora-native agent skills. Terminal-style market data, verified skill gallery, and public leaderboards.

- Animated highlighter stroke on hero headings (motion/react, ease-out-quint)
- Homepage terminal market board with trending coins, gainers, volume leaders, and top traders
- 5 verified skills with read-only scouts plus one execution-capable trader
- Get-started steps and works-with section on the homepage
- Agent and portfolio views for mock P&L, holdings, and leaderboard context
- Weekly trader leaderboard
- Shared runtime picker with direct install commands and source links for each skill
- Agent-facing API at `/api` with discovery document, skill catalog, explore data, and leaderboard

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
│   ├── skills/    Editorial skill gallery with shared runtime picker
│   ├── portfolio/ Mock portfolio view
│   ├── agents/    Agent list and profile pages
│   ├── leaderboard/
│   └── trust/     Trust & Safety
├── components/    UI components (nav, terminal board, tables, shadcn/ui)
└── lib/           SDK wrapper, skill data, utilities
```

The homepage hero uses an animated highlighter stroke that sweeps left-to-right on load. The "Agent activity" module is a light TUI-style board that server-renders initial rows, refreshes through the public API routes, and uses a CRT sweep during loading.

## Skills

| Skill | What it does | Risk |
|-------|-------------|------|
| Trend Scout | Trending coins, new launches, gainers, momentum | Read-only |
| Creator Pulse | Creator coin ecosystems, featured creators, watchlists | Read-only |
| Briefing Bot | Structured morning/evening market digest | Read-only |
| Portfolio Scout | Wallet balance + coin holdings (Bankr-ready) | Read-only |
| Momentum Trader | Auto-buys trending Zora coins on momentum signals via Zora CLI | Execution-capable |

All skills use the OpenClaw SKILL.md format. Most are read-only; Momentum Trader should only run in a dedicated trader wallet created with Zora CLI.

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
