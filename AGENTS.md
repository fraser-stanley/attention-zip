# Agent Contributor Guide

Extended reference for AI agents working on this codebase. Read `CLAUDE.md` first for project overview.

## SDK query reference

All queries are wrapped in `src/lib/zora.ts`. Client pages never call the SDK directly — they fetch from API routes.

| Wrapper function | SDK function | Params | Response shape | Refresh |
|-----------------|-------------|--------|---------------|---------|
| `fetchCoins("trending", n)` | `getTrendingAll` | `{ count }` | `CoinNode[]` | 30s |
| `fetchCoins("mcap", n)` | `getCoinsMostValuable` | `{ count }` | `CoinNode[]` | 60s |
| `fetchCoins("new", n)` | `getCoinsNew` | `{ count }` | `CoinNode[]` | 30s |
| `fetchCoins("volume", n)` | `getCoinsTopVolume24h` | `{ count }` | `CoinNode[]` | 60s |
| `fetchCoins("gainers", n)` | `getCoinsTopGainers` | `{ count }` | `CoinNode[]` | 30s |
| `fetchCoins("creators", n)` | `getCreatorCoins` | `{ count }` | `CoinNode[]` | 60s |
| `fetchCoins("featured", n)` | `getFeaturedCreators` | `{ first }` | `CoinNode[]` | 60s |
| `fetchLeaderboard(n)` | `getTraderLeaderboard` | `{ first }` | `Record[]` | 5min |
| `fetchCoinDetail(addr)` | `getCoin` | `{ address, chain: 8453 }` | `Record \| null` | on-demand |
| `fetchCoinSwapsData(addr, n)` | `getCoinSwaps` | `{ address, chain: 8453, first }` | `Record[]` | on-demand |
| `fetchCoinHoldersData(addr, n)` | `getCoinHolders` | `{ chainId: 8453, address, count }` | `Record[]` | on-demand |
| `fetchProfileBalances(id, n)` | `getProfileBalances` | `{ identifier, count }` | `Record[]` | on-demand |
| `fetchProfileCoins(id, n)` | `getProfileCoins` | `{ identifier, count }` | `Record[]` | on-demand |

## Common pitfalls

### SDK parameter names are inconsistent

Most explore functions use `{ count }` but `getFeaturedCreators` and `getTraderLeaderboard` use `{ first }`. `getCoinHolders` uses `chainId` (number) while `getCoinSwaps` uses `chain` (number). Always check the type definitions before adding a new query.

### shadcn/ui v2 has no `asChild`

The Button component uses `@base-ui/react`, not Radix. `asChild` does not exist. Use `buttonVariants()` with `<Link>` instead. See `CLAUDE.md` for the correct pattern.

### Type narrowing for SDK responses

SDK responses are typed as `Record<string, unknown>`. You must narrow before using values in JSX:

```tsx
// Wrong — unknown is not a valid ReactNode
<span>{coin.symbol}</span>

// Correct — narrow first
{typeof coin.symbol === "string" && <span>{coin.symbol}</span>}
```

### Client vs server components

- Pages that use React Query, `useState`, or `useParams` must have `"use client"` at the top
- API routes in `src/app/api/` are server-side (access SDK directly, read env vars)
- The root layout (`layout.tsx`) wraps everything in `<Providers>` which sets up React Query

## How to add a skill

1. Create a skill directory at the project root: `<skill-slug>/SKILL.md`, `<skill-slug>/clawhub.json`, `<skill-slug>/scripts/validate.sh`
2. Add a new entry to the `skills` array in `src/lib/skills.ts`. The `id` must match the directory name and SKILL.md `name` field.
3. Follow the `Skill` interface: `id`, `name`, `description`, `longDescription`, `risk`, `riskLabel`, `monitors`, `wraps`, `installCommand`, `samplePrompt`, `sampleOutput`, `badges`, `githubUrl`, `skillMdUrl`, `installs`
4. Both the homepage skills preview grid and `/skills` gallery render from this array. No other page changes needed.
5. If the skill needs new SDK data, add the wrapper function to `src/lib/zora.ts` and create an API route
6. Run `pnpm test` to validate SKILL.md structure, cross-file sync, and CLI flag correctness

## How to add a page

Follow the existing pattern:

1. **API route** (if new data): `src/app/api/<name>/route.ts` — import from `src/lib/zora.ts`, return JSON
2. **Page component**: `src/app/<name>/page.tsx` — `"use client"`, React Query fetch from API route, shadcn/ui components
3. **Nav link**: Add to `src/components/nav.tsx` links array

## How to add an SDK query

1. Check the SDK types at `node_modules/@zoralabs/coins-sdk/dist/api/queries.d.ts` for available functions and their parameter types
2. Import the function in `src/lib/zora.ts`
3. Write a wrapper that handles error checking and response extraction
4. Expose via an API route if the frontend needs it

## Testing

```bash
pnpm test    # vitest — skill structure + data integrity
pnpm build   # TypeScript + Next.js compilation
```

Tests validate SKILL.md frontmatter, required body sections, word count (300-800), CLI flag correctness in wraps, clawhub.json schema, and cross-file sync between skills.ts IDs and skill directories. Always run both after making changes.

## Formatting helpers

`src/lib/zora.ts` exports these utilities:

- `formatCompactCurrency(value)` — `"$1.2M"`, `"$450.2K"` format
- `formatChange(marketCap, delta)` — `{ value: "+12.3%", positive: true }` from absolute delta
- `truncateAddress(addr)` — `"0x1234...5678"`
- `coinTypeLabel(type)` — `"CONTENT"` → `"post"`, `"CREATOR"` → `"creator-coin"`, `"TREND"` → `"trend"`

## Skill format (AgentSkills/ClawHub)

Each skill directory follows the AgentSkills convention:

```
<skill-slug>/
├── SKILL.md          # Agent instructions (OpenClaw format)
├── clawhub.json      # Runtime config (requires, tunables)
└── scripts/
    └── validate.sh   # Structural validation
```

**SKILL.md frontmatter** uses flat `metadata` strings:
```yaml
---
name: <skill-slug>          # must match directory name
description: <max 1024 chars>
metadata:
  author: "Zora Agent Skills"
  version: "1.0.0"
  displayName: "<Human Name>"
  difficulty: "beginner|intermediate|advanced"
---
```

**SKILL.md body** must contain these 8 sections in order:
1. `## When to Use This Skill`
2. `## Setup`
3. `## Configuration`
4. `## Commands`
5. `## How It Works`
6. `## Example Output`
7. `## Troubleshooting`
8. `## Important Notes`

**clawhub.json**: `requires.bins` for CLI deps, `requires.env` for env vars (execution skills only), `tunables` for configurable parameters. No `config.schema.json`.
