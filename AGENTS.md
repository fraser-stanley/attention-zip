# Agent Contributor Guide

Extended reference for AI agents working on this codebase. Read `CLAUDE.md` first for project overview.

## SDK query reference

All queries are wrapped in `src/lib/zora.ts`. Client pages never call the SDK directly — they fetch from API routes.

| Wrapper function                | SDK function           | Params                              | Response shape   | Refresh   |
| ------------------------------- | ---------------------- | ----------------------------------- | ---------------- | --------- |
| `fetchCoins("trending", n)`     | `getTrendingAll`       | `{ count }`                         | `CoinNode[]`     | 30s       |
| `fetchCoins("mcap", n)`         | `getCoinsMostValuable` | `{ count }`                         | `CoinNode[]`     | 60s       |
| `fetchCoins("new", n)`          | `getCoinsNew`          | `{ count }`                         | `CoinNode[]`     | 30s       |
| `fetchCoins("volume", n)`       | `getCoinsTopVolume24h` | `{ count }`                         | `CoinNode[]`     | 60s       |
| `fetchCoins("gainers", n)`      | `getCoinsTopGainers`   | `{ count }`                         | `CoinNode[]`     | 30s       |
| `fetchCoins("creators", n)`     | `getCreatorCoins`      | `{ count }`                         | `CoinNode[]`     | 60s       |
| `fetchCoins("featured", n)`     | `getFeaturedCreators`  | `{ first }`                         | `CoinNode[]`     | 60s       |
| `fetchLeaderboard(n)`           | `getTraderLeaderboard` | `{ first }`                         | `TraderNode[]`   | 5min      |
| `fetchProfileBalances(addr, n)` | `getProfileBalances`   | `{ identifier, count, sortOption, excludeHidden, chainIds }` | `ProfileBalance[]` | on-demand |

**Not yet implemented** (SDK functions exist but no wrapper in `zora.ts`):

| SDK function         | Params                              | Notes                                   |
| -------------------- | ----------------------------------- | --------------------------------------- |
| `getCoin`            | `{ address, chain: 8453 }`          | Single coin detail                      |
| `getCoinSwaps`       | `{ address, chain: 8453, first }`   | Trade history for a specific coin       |
| `getCoinHolders`     | `{ chainId: 8453, address, count }` | Holder list for a specific coin         |
| `getProfileCoins`    | `{ identifier, count }`             | Created coins for a wallet              |

## Common pitfalls

### SDK parameter names are inconsistent

Most explore functions use `{ count }` but `getFeaturedCreators` and `getTraderLeaderboard` use `{ first }`. `getCoinHolders` uses `chainId` (number) while `getCoinSwaps` uses `chain` (number). Always check the type definitions before adding a new query.

### Leaderboard responses changed shape

`getTraderLeaderboard()` currently returns `data.exploreTraderLeaderboard`, not `data.traderLeaderboard`, with nested fields like `weekVolumeUsd`, `weekTradesCount`, and `traderProfile.handle`. Treat `src/lib/zora.ts` as the normalization layer and do not bind UI code directly to the raw SDK response.

### shadcn/ui v2 has no `asChild`

The Button component uses `@base-ui/react`, not Radix. `asChild` does not exist. Use `buttonVariants()` with `<Link>` instead. See `CLAUDE.md` for the correct pattern.

### Type narrowing for SDK responses

SDK responses are typed as `Record<string, unknown>`. You must narrow before using values in JSX:

```tsx
// Wrong — unknown is not a valid ReactNode
<span>{coin.symbol}</span>;

// Correct — narrow first
{
  typeof coin.symbol === "string" && <span>{coin.symbol}</span>;
}
```

### Client vs server components

- Pages that use React Query, `useState`, or `useParams` must have `"use client"` at the top
- API routes in `src/app/api/` are server-side (access SDK directly, read env vars)
- The root layout (`layout.tsx`) wraps everything in `<Providers>` which sets up React Query

### Tests stub the Zora CLI

`pnpm test` does not require the real Zora CLI. The managed entrypoint tests inject a stub `zora` command into `PATH` so they can validate worker behavior without the actual binary installed.

When docs say a skill requires a "real `zora` binary on `PATH`", that means the installed CLI must be discoverable by your shell. `command -v zora` and `zora --help` should both succeed before you rely on `scripts/validate.sh` or any live wallet-backed flow.

### Public copy is market-first

For homepage, skills page, metadata, JSON-LD, and other visitor-facing copy, lead with trends, market scans, briefings, portfolios, and momentum trading. Do not lead with `entrypoint`, `clawhub.json`, `manifest`, `env vars`, or other implementation terms unless the page is explicit technical documentation. attention.zip helps agents use the Zora market, it is not Zora itself. Prefer named skills when wallet guidance differs. Avoid generic trust boilerplate unless it is literally true on that surface. One clear install instruction is enough, repeating the same helper line on every skill row reads robotic.

### Custom staging auth only gates pages

If `STAGING_PASSWORD` is set, `src/proxy.ts` redirects visitor-facing pages to `/login` and expects the `staging_auth` cookie. Do not remove this as "redundant" auth. It exists because the Vercel project cannot use native password protection. Keep `/api`, `/api/*`, `/skills/[id]/skill-md`, `/.well-known/ai.json`, `/llms.txt`, `/llms-full.txt`, and static public files accessible so agent installs and discovery still work.

## How to add a skill

1. Create a skill directory at the project root: `<skill-slug>/SKILL.md`, `<skill-slug>/clawhub.json`, `<skill-slug>/scripts/run.mjs`, `<skill-slug>/scripts/validate.sh`
2. Add a new entry to the `skills` array in `src/lib/skills.ts`. The `id` must match the directory name and SKILL.md `name` field.
3. Follow the `Skill` interface in `src/lib/skills.ts`: metadata, `commands`, `requires`, `automation`, sample prompt/output, badges, and public source URLs all need to stay in sync with the skill folder.
4. The `/skills` gallery, install command surfaces, discovery docs, and `/api/skills` serializer all derive from this array. If you change the managed/runtime shape, update those surfaces together.
5. If the skill needs new SDK data, add the wrapper function to `src/lib/zora.ts` and create an API route.
6. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before merging. `pnpm test` validates SKILL.md structure, entrypoint metadata, CLI flag correctness, and the managed entrypoint harness.

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
pnpm lint        # eslint
pnpm typecheck   # direct TypeScript check (tsc --noEmit)
pnpm test        # vitest — structure, metadata, and managed entrypoint integration
pnpm build       # TypeScript + Next.js compilation
```

## Deploy

The shared staging site is the Vercel project `zoraskills-staging` in the `frasers-projects-053d31c6` scope. `https://zoraskills-staging.vercel.app/` is that project's production alias, so updating staging requires:

```bash
vercel link --yes --scope frasers-projects-053d31c6 --project zoraskills-staging
vercel deploy --prod --yes --scope frasers-projects-053d31c6
```

If a workspace was previously linked to another Vercel project, check `.vercel/project.json` before deploying.

Tests validate SKILL.md frontmatter, required body sections, word count (300-800), CLI flag correctness in commands, managed entrypoint metadata in `clawhub.json`, process-level `scripts/run.mjs` behavior through `src/__tests__/skill-entrypoints.test.ts`, and cross-file sync between skills.ts IDs and skill directories. `scripts/validate.sh` is still useful, but it is a host-readiness check. Run it from inside the skill directory, make sure the installed `zora` CLI is on your shell `PATH`, and expect wallet-backed skills to require a configured wallet.

Discovery coverage lives in `src/__tests__/discovery.test.ts`. If you change `llms.txt`, `llms-full.txt`, `/.well-known/ai.json`, or `/api/skills` install serialization, update those assertions in the same PR.

## Formatting helpers

`src/lib/zora.ts` exports these utilities:

- `formatCompactCurrency(value)` — `"$1.2M"`, `"$450.2K"`, `"<$1"` for sub-dollar, `"—"` for null/undefined
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
    ├── run.mjs       # Managed runtime entrypoint
    └── validate.sh   # Host-readiness validation
```

**SKILL.md frontmatter** uses flat `metadata` strings:

```yaml
---
name: <skill-slug> # must match directory name
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

**clawhub.json**: `automaton.managed: true` with `automaton.entrypoint: "scripts/run.mjs"`, `requires.bins` for CLI deps, `requires.env` for env vars (wallet-backed skills), and `tunables` for configurable parameters. No `config.schema.json`.
