# Zora Agent Skills

Discovery and install surface for Zora-native agent skills. Live market data, verified skill gallery, public leaderboards.

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
│   ├── layout.tsx                  # Root layout (dark mode, Geist fonts, Providers, Nav)
│   ├── globals.css                 # Tailwind imports + CSS variables
│   ├── dashboard/page.tsx          # Tabbed explore (trending, mcap, new, volume, gainers, creators)
│   ├── skills/page.tsx             # Skill gallery with install commands + sample output
│   ├── leaderboard/page.tsx        # Weekly trader rankings
│   ├── trust/page.tsx              # Trust & Safety (wallet presets, scope disclaimers)
│   ├── coin/[address]/page.tsx     # Coin detail (stats, swaps, holders)
│   └── api/
│       ├── explore/route.ts        # SDK explore queries (hides API key server-side)
│       ├── coin/[address]/route.ts # Coin detail + swaps + holders
│       └── leaderboard/route.ts    # Trader leaderboard
├── components/
│   ├── nav.tsx                     # Navigation bar
│   ├── home-live-cards.tsx         # 4 live data cards (trending, gainers, volume, traders)
│   ├── coin-table.tsx              # Reusable coin data table
│   └── ui/                         # shadcn/ui components (button, card, badge, table, tabs, etc.)
└── lib/
    ├── zora.ts                     # SDK wrapper: all query functions + formatting helpers
    ├── skills.ts                   # Static skill definitions (4 skills)
    ├── providers.tsx               # React Query provider (30s staleTime)
    └── utils.ts                    # cn() helper for className merging
```

## Key decisions

- **All SDK calls go through API routes** (`/api/explore`, `/api/coin/[address]`, `/api/leaderboard`) so the API key stays server-side. Client pages fetch from these routes via React Query.
- **Skills are static data** in `src/lib/skills.ts`. No database, no CMS. The homepage grid and skills gallery both render from this array — add a skill to the array and both pages update automatically.
- **No `config.schema.json`** for skills. Config is documented inline in SKILL.md files, following Bankr/OpenClaw conventions.
- **React Query** with 30s `staleTime` and interval refresh. Dashboard tabs refetch on focus.

## shadcn/ui v2 — critical gotcha

shadcn/ui v2 uses `@base-ui/react` instead of Radix. The `Button` component does **not** support `asChild`.

Wrong:
```tsx
<Button asChild><Link href="/foo">Go</Link></Button>
```

Correct:
```tsx
<Link href="/foo" className={buttonVariants({ variant: "outline" })}>Go</Link>
```

Always import `buttonVariants` from `@/components/ui/button` and apply it to `<Link>` directly.

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

## Product boundaries

- No execution infrastructure (wait for CLI buy/sell to ship)
- No custody or key management
- No server-side enforcement or guardrails
- No third-party skill submissions
- No paid features or tokens
- Verification = we reviewed published source. Does not mean we control local runtime.
