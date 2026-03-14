# Changelog

## v0.1.0

Initial build of the Zora Agent Skills discovery surface.

### Surfaces

- Homepage with hero, live data cards (trending, gainers, volume, traders), skills preview grid, waitlist form
- Dashboard with 6 tabbed explore views (trending, market cap, new, volume, gainers, creator coins)
- Skills gallery with 4 verified skills, install commands, sample prompts and outputs
- Coin detail pages (`/coin/[address]`) with market stats, recent swaps, top holders
- Leaderboard page with weekly trader rankings
- Trust & Safety page with wallet safety presets and honest scope disclaimers

### Skills

- **Trend Scout** — trending coins, new launches, gainers, momentum
- **Creator Pulse** — creator coin ecosystems, featured creators, watchlists
- **Briefing Bot** — structured morning/evening market digest
- **Portfolio Scout** — read-only wallet balance + coin holdings (Bankr-ready)

All skills are read-only, use the OpenClaw SKILL.md format, and require no wallet or private key.

### Technical

- API routes wrapping `@zoralabs/coins-sdk` v0.4.7 (explore, coin detail, leaderboard)
- React Query caching with 30s staleTime and interval refresh
- Profile balance/coins SDK integration for Portfolio Scout
- shadcn/ui v2 component library with dark mode
