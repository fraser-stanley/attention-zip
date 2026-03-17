# Zora Agent Skills

Agent-first discovery and install surface for Zora-native skills. Live market data, verified skill gallery, public leaderboards, and machine-readable API docs.

**Not** an execution platform, custody layer, or marketplace. Execution is local to the user's agent runtime. We don't hold keys, submit transactions, or enforce guardrails server-side.

## Tech stack

- **Next.js 16** (App Router) with TypeScript (strict mode)
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **shadcn/ui v2** — uses `@base-ui/react` (NOT Radix)
- **React Query** (`@tanstack/react-query`) for client-side caching
- **@zoralabs/coins-sdk v0.4.7** for all Zora protocol data
- **pnpm** for package management
- Deploy target: **Vercel**

## How to run

```bash
pnpm install
pnpm dev          # dev server at localhost:3000
pnpm build        # production build (primary verification gate)
pnpm lint         # eslint
```

### Environment

Create `.env.local`:

```
ZORA_API_KEY=your_key_here
```

The API key is **optional**. The SDK works without it (uses registered queries), but requests are rate-limited. Get a key from https://zora.co/settings/developer.

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage (hero, live cards, skills preview, waitlist)
│   ├── layout.tsx                  # Root layout (metadata, JSON-LD, Providers, Nav)
│   ├── globals.css                 # Tailwind imports + CSS variables
│   ├── dashboard/page.tsx          # Server-rendered shell + streamed dashboard tabs
│   ├── skills/page.tsx             # Server-rendered editorial skill gallery + JSON-LD
│   ├── leaderboard/page.tsx        # Weekly trader rankings with server-fetched initial data
│   ├── portfolio/page.tsx          # Mock logged-in portfolio (Simmer-style PnL, positions, skills)
│   ├── agents/page.tsx             # Agent list (trader leaderboard with portfolio links)
│   ├── agents/[address]/page.tsx   # Agent profile (PnL, sparkline, positions, holdings)
│   ├── trust/page.tsx              # Trust & Safety (wallet presets, scope disclaimers)
│   └── api/
│       ├── route.ts                # API discovery document
│       ├── skills/route.ts         # Skill catalog for agents
│       ├── explore/route.ts        # Explore queries + cache headers
│       ├── leaderboard/route.ts    # Trader leaderboard
│       └── agents/[address]/route.ts # Agent profile data
├── components/
│   ├── nav.tsx                     # Navigation bar (7 sections incl. Portfolio)
│   ├── hero-section.tsx            # Hero layout with orb + CTA (highlight-block headings)
│   ├── hero-orb-glass.tsx          # Concrete dithered orb (R3F + spring click + velocity rotation)
│   ├── hero-orb-glass-loader.tsx   # Dynamic import wrapper (ssr: false)
│   ├── command-menu-loader.tsx     # Lazy client-only command menu mount
│   ├── home-live-cards.tsx         # Hydrated live cards with server initial data
│   ├── dashboard-tabs.tsx          # Client dashboard tabs + table refresh
│   ├── leaderboard-table.tsx       # Client leaderboard refresh wrapper
│   ├── skill-card-client.tsx       # Shared runtime picker + command blocks + expandable skill details
│   ├── coin-table.tsx              # Reusable coin data table
│   ├── portfolio-view.tsx          # Simmer-style portfolio (stats, sparkline, positions, skills)
│   ├── agent-profile-detail.tsx    # Agent profile with PnL, positions, sparkline, holdings
│   ├── pnl-sparkline.tsx           # SVG sparkline for cumulative PnL charts
│   ├── activity-ticker.tsx         # Live activity marquee ticker
│   ├── activity-ticker-section.tsx # Activity ticker wrapper section
│   └── ui/                         # shadcn/ui components (button, card, badge, table, tabs, etc.)
├── public/
│   └── .well-known/ai.json         # Agent discovery metadata
├── public/
│   └── textures/                   # PBR texture maps (concrete diffuse/normal/roughness, env map)
└── lib/
    ├── data.ts                     # Cached server data helpers for pages and routes
    ├── site.ts                     # Site metadata and URL helpers
    ├── zora.ts                     # SDK wrapper: all query functions + formatting helpers
    ├── skills.ts                   # Static skill definitions (5 skills)
    ├── providers.tsx               # React Query provider (30s staleTime)
    ├── utils.ts                    # cn() helper for className merging
    ├── pnl-utils.ts                # Shared PnL formatting (pnlColor, formatPnl, formatPct)
    ├── portfolio-mock-data.ts      # Mock portfolio data (positions, trades, sparkline)
    ├── agent-mock-data.ts          # Mock agent PnL data (positions, trades, sparkline)
    └── shaders/
        └── dither-effect.ts        # 4x4 Bayer matrix dithering post-process (binary output)
├── proxy.ts                        # CORS headers for /api/*
```

## Key decisions

- **Server components fetch initial data directly** through `src/lib/data.ts`, which wraps the SDK with `unstable_cache` and mock-data fallbacks. This keeps the first paint server-rendered without duplicating fetch logic.
- **Client components still refresh through API routes** (`/api/explore`, `/api/leaderboard`) using React Query. The API remains the public integration surface for external agents and local tooling.
- **Agent discovery is explicit** via `/api`, `/api/skills`, JSON-LD, and `/.well-known/ai.json`.
- **Skills are static data** in `src/lib/skills.ts`. No database, no CMS. The homepage grid and skills gallery both render from this array — add a skill to the array and both pages update automatically.
- **Install commands are shared** from `src/lib/skills.ts` so the UI and `/api/skills` stay in sync.
- **The skills page stays intentionally flat** — one shared runtime picker updates every command block, while deeper verification details stay expandable so the list remains fast to scan.
- **No `config.schema.json`** for skills. Config is documented inline in SKILL.md files, following Bankr/OpenClaw conventions.
- **Command menu is lazy-loaded** through `src/components/command-menu-loader.tsx` so it does not affect the initial page payload.
- **React Query** handles live refresh after hydration. Initial render is server-owned for `/`, `/dashboard`, and `/leaderboard`.
- **Portfolio page is mock data only** — `src/lib/portfolio-mock-data.ts` provides all positions, trades, PnL stats, and sparkline data. No real wallet connection. Will be replaced with live data when trade history indexing ships.
- **Agent profiles use mock PnL data** — `src/lib/agent-mock-data.ts` provides mock positions, trades, and sparkline for agent profile pages. Real profile data (holdings, created coins) comes from the SDK.
- **PnL utilities are shared** — `src/lib/pnl-utils.ts` exports `pnlColor()`, `formatPnl()`, `formatPct()` used by both portfolio and agent profile pages. Gains = `#3FFF00`, losses = `#FF00F0`.
- **Green highlight block treatment** — `.highlight-block` class in `globals.css` applies `#3FFF00` bg + black text with `box-decoration-break: clone` for per-line blocks. Used on hero heading and portfolio stat numbers. Primary button variant also uses `#3FFF00`.

## shadcn/ui v2 — critical gotcha

shadcn/ui v2 uses `@base-ui/react` instead of Radix. The `Button` component does **not** support `asChild`.

Wrong:
```tsx
<Button asChild><Link href="/foo">Go</Link></Button>
```

Correct:
```tsx
import { buttonVariants } from "@/components/ui/button-variants"

<Link href="/foo" className={buttonVariants({ variant: "outline" })}>Go</Link>
```

Import `buttonVariants` from `@/components/ui/button-variants` for server-safe usage with `<Link>`. The interactive `<Button>` component still lives in `@/components/ui/button`.

## SDK parameter inconsistencies

The `@zoralabs/coins-sdk` functions use different parameter names. These are documented here because they caused build failures during initial development:

| Function | Parameters | Notes |
|----------|-----------|-------|
| `getTrendingAll` | `{ count }` | |
| `getCoinsMostValuable` | `{ count }` | |
| `getCoinsNew` | `{ count }` | |
| `getCoinsTopVolume24h` | `{ count }` | |
| `getCoinsTopGainers` | `{ count }` | |
| `getCreatorCoins` | `{ count }` | |
| `getFeaturedCreators` | `{ first }` | NOT `count` |
| `getTraderLeaderboard` | `{ first }` | NOT `count` |
| `getCoin` | `{ address, chain }` | chain is number (8453 for Base) |
| `getCoinSwaps` | `{ address, chain, first }` | `chain` is number, `first` not `count` |
| `getCoinHolders` | `{ chainId, address, count }` | `chainId` not `chain` |
| `getProfileBalances` | `{ identifier, count }` | `identifier` is wallet address |
| `getProfileCoins` | `{ identifier, count }` | `identifier` is wallet address |

All SDK responses return `{ error, data }`. Always check `response.error` before accessing data.

## Skills

5 first-party verified skills:

1. **Trend Scout** — trending coins, new launches, gainers, momentum
2. **Creator Pulse** — creator coin ecosystems, featured creators, watchlists
3. **Briefing Bot** — structured morning/evening market digest
4. **Portfolio Scout** — wallet balance + coin holdings (Bankr-ready bridge skill)
5. **Momentum Trader** — auto-buys trending Zora coins on momentum signals via Zora CLI. Execution-capable — requires dedicated trader wallet created with `zora setup`.

Skills 1–4 are read-only (no wallet needed). Skill 5 is execution-capable via the Zora CLI's native wallet and buy/sell commands. All use OpenClaw SKILL.md format.

## Agent-facing endpoints

- `/api` — discovery document listing public endpoints
- `/api/skills` — full skill catalog JSON
- `/api/skills?id=<skill-id>` — single skill lookup
- `/api/explore` — live explore data with cache headers
- `/api/leaderboard` — leaderboard data with cache headers
- `/api/agents/<address>` — agent profile data (balances, coins, volume, rank)
- `/.well-known/ai.json` — simple discovery document for crawlers and agents

## Product boundaries

- Execution skills (Momentum Trader) run locally via Zora CLI — we don't execute trades server-side
- No custody or key management
- No server-side enforcement or guardrails
- No third-party skill submissions
- No paid features or tokens
- Verification = we reviewed published source. Does not mean we control local runtime.
