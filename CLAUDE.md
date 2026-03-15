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
│   ├── skills/page.tsx             # Server-rendered skill gallery + JSON-LD
│   ├── leaderboard/page.tsx        # Weekly trader rankings with server-fetched initial data
│   ├── trust/page.tsx              # Trust & Safety (wallet presets, scope disclaimers)
│   └── api/
│       ├── route.ts                # API discovery document
│       ├── skills/route.ts         # Skill catalog for agents
│       ├── explore/route.ts        # Explore queries + cache headers
│       └── leaderboard/route.ts    # Trader leaderboard
├── components/
│   ├── nav.tsx                     # Navigation bar
│   ├── command-menu-loader.tsx     # Lazy client-only command menu mount
│   ├── home-live-cards.tsx         # Hydrated live cards with server initial data
│   ├── dashboard-tabs.tsx          # Client dashboard tabs + table refresh
│   ├── leaderboard-table.tsx       # Client leaderboard refresh wrapper
│   ├── skill-card-client.tsx       # Install block + output toggle
│   ├── coin-table.tsx              # Reusable coin data table
│   └── ui/                         # shadcn/ui components (button, card, badge, table, tabs, etc.)
├── public/
│   └── .well-known/ai.json         # Agent discovery metadata
└── lib/
    ├── data.ts                     # Cached server data helpers for pages and routes
    ├── site.ts                     # Site metadata and URL helpers
    ├── zora.ts                     # SDK wrapper: all query functions + formatting helpers
    ├── skills.ts                   # Static skill definitions (4 skills)
    ├── providers.tsx               # React Query provider (30s staleTime)
    └── utils.ts                    # cn() helper for className merging
├── proxy.ts                        # CORS headers for /api/*
```

## Key decisions

- **Server components fetch initial data directly** through `src/lib/data.ts`, which wraps the SDK with `unstable_cache` and mock-data fallbacks. This keeps the first paint server-rendered without duplicating fetch logic.
- **Client components still refresh through API routes** (`/api/explore`, `/api/leaderboard`) using React Query. The API remains the public integration surface for external agents and local tooling.
- **Agent discovery is explicit** via `/api`, `/api/skills`, JSON-LD, and `/.well-known/ai.json`.
- **Skills are static data** in `src/lib/skills.ts`. No database, no CMS. The homepage grid and skills gallery both render from this array — add a skill to the array and both pages update automatically.
- **Install commands are shared** from `src/lib/skills.ts` so the UI and `/api/skills` stay in sync.
- **No `config.schema.json`** for skills. Config is documented inline in SKILL.md files, following Bankr/OpenClaw conventions.
- **Command menu is lazy-loaded** through `src/components/command-menu-loader.tsx` so it does not affect the initial page payload.
- **React Query** handles live refresh after hydration. Initial render is server-owned for `/`, `/dashboard`, and `/leaderboard`.

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

4 first-party, read-only, verified skills:

1. **Trend Scout** — trending coins, new launches, gainers, momentum
2. **Creator Pulse** — creator coin ecosystems, featured creators, watchlists
3. **Briefing Bot** — structured morning/evening market digest
4. **Portfolio Scout** — wallet balance + coin holdings (Bankr-ready bridge skill)

All use OpenClaw SKILL.md format. All read-only — no wallet or private key needed.

## Agent-facing endpoints

- `/api` — discovery document listing public endpoints
- `/api/skills` — full skill catalog JSON
- `/api/skills?id=<skill-id>` — single skill lookup
- `/api/explore` — live explore data with cache headers
- `/api/leaderboard` — leaderboard data with cache headers
- `/.well-known/ai.json` — simple discovery document for crawlers and agents

## Product boundaries

- No execution infrastructure (wait for CLI buy/sell to ship)
- No custody or key management
- No server-side enforcement or guardrails
- No third-party skill submissions
- No paid features or tokens
- Verification = we reviewed published source. Does not mean we control local runtime.
