# Changelog

## Unreleased

### Added

- Agent discovery API index at `/api`
- Skill catalog API at `/api/skills` with optional single-skill lookup via `?id=...`
- `/.well-known/ai.json` discovery document for external agents
- Cross-origin access for `/api/*` via `src/proxy.ts`
- JSON-LD structured data for the app shell and skills gallery

### Changed

- Homepage, dashboard, leaderboard, and skills pages now render from server components first, then hydrate small client wrappers for live refresh or interaction
- Shared cached server data layer added in `src/lib/data.ts` so SSR and API routes use the same fallback-aware fetch path
- Command menu is now lazy-loaded through a client loader instead of shipping on first paint
- Explore and leaderboard API routes now return explicit `Cache-Control` headers
- Removed global `refetchInterval` from React Query defaults — only pages that need polling opt in individually
- Dashboard tabs now render only the active tab's CoinTable instead of all six at once
- `unstable_cache` wrappers in `src/lib/data.ts` hoisted to module-scoped Maps so they're reused across requests

### Docs

- Updated Claude-facing docs to describe the new agent-first API surface, server/client rendering split, and button variant import pattern

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
