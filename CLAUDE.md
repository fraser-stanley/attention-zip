# Zora Agent Skills

Agent skills and live market data for the Zora attention market. Attention Index helps agents use the Zora market, it is not Zora itself.

**Not** an execution platform, custody layer, or marketplace. Execution is local to the user's agent runtime. We don't hold keys, submit transactions, or enforce guardrails server-side.

## Tech stack

- **Next.js 16** (App Router) with TypeScript (strict mode)
- **Tailwind CSS v4** with `@tailwindcss/postcss`
- **shadcn/ui v2** — uses `@base-ui/react` (NOT Radix)
- **React Query** (`@tanstack/react-query`) for client-side caching
- **@zoralabs/coins-sdk v0.5.1** for all Zora protocol data
- **pnpm** for package management
- Deploy target: **Vercel**

## How to run

```bash
pnpm install
pnpm dev          # dev server at localhost:3000
pnpm typecheck    # direct TypeScript check (tsc --noEmit)
pnpm lint         # eslint
pnpm test         # vitest skill structure + managed entrypoint tests
pnpm build        # production build (primary verification gate)
```

### Environment

Create `.env.local`:

```
ZORA_API_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_REPO_URL=https://github.com/fraser-stanley/zora-agent-skills
NEXT_PUBLIC_SITE_REPO_REF=main
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

The API key is **optional**. The SDK works without it (uses registered queries), but requests are rate-limited. Get a key from https://zora.co/settings/developer.

`NEXT_PUBLIC_SITE_URL` sets canonical metadata and install prompts outside Vercel. `NEXT_PUBLIC_SITE_REPO_URL` and `NEXT_PUBLIC_SITE_REPO_REF` control the public source links shown in the UI and discovery docs. `ALLOW_MOCK_MARKET_DATA=true` opts back into mock market fallbacks if you need them for local design work, but production defaults to empty states instead of fabricated live data.

If you set `STAGING_PASSWORD`, visitor-facing pages are gated behind `/login`. This is the repo's custom staging gate for Vercel hobby deployments. `GET /api`, `GET /api/*`, `GET /skills/[id]/skill-md`, `GET /.well-known/ai.json`, `GET /llms.txt`, `GET /llms-full.txt`, `GET /claim/[code]`, and static public files stay public so agent installs, discovery, and wallet claiming still work.

Agent registration and claiming require direct Upstash Redis credentials. This repo uses only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Do not use `Redis.fromEnv()` or reintroduce `KV_REST_*` fallback handling.

The two mutation routes are IP-rate-limited in Redis: `POST /api/agents/register` allows 5 requests per 10 minutes, and `POST /api/agents/claim` allows 10 requests per 10 minutes. Over-limit responses return `429` with `Retry-After` and `X-RateLimit-*` headers.

## Project structure

```
trend-scout/                        # Skill: trending topic coins, new trends, momentum
creator-pulse/                      # Skill: creator coin ecosystems
briefing-bot/                       # Skill: structured market digest
portfolio-scout/                    # Skill: coin holdings (read-only)
momentum-trader/                    # Skill: momentum trading
src/
├── __tests__/
│   ├── skills-structure.test.ts    # SKILL.md + clawhub.json structural validation
│   ├── skills-data.test.ts         # skills.ts array integrity + cross-file sync
│   ├── discovery.test.ts           # ai.json, llms docs, and API discovery contract
│   ├── staging-auth.test.ts        # Staging auth token + redirect sanitization
│   └── wallet-address.test.ts      # Address validation helpers
├── app/
│   ├── page.tsx                    # Homepage (hero, terminal market board, skills preview, waitlist)
│   ├── loading.tsx                 # Homepage loading skeleton (instant nav)
│   ├── layout.tsx                  # Root layout (metadata, JSON-LD, Providers, Nav)
│   ├── globals.css                 # Tailwind imports + CSS variables
│   ├── dashboard/page.tsx          # Server-rendered shell + streamed dashboard tabs
│   ├── dashboard/loading.tsx       # Dashboard loading skeleton
│   ├── skills/page.tsx             # Server-rendered editorial skill gallery + JSON-LD
│   ├── skills/[id]/skill-md/route.ts # Raw SKILL.md serving for agent consumption
│   ├── leaderboard/page.tsx        # Weekly trader rankings with server-fetched initial data
│   ├── leaderboard/loading.tsx     # Leaderboard loading skeleton
│   ├── llms.txt/route.ts           # Short agent-readable docs
│   ├── llms-full.txt/route.ts      # Full agent-readable docs
│   ├── claim/[code]/page.tsx       # Public agent claim page
│   ├── portfolio/page.tsx          # Address-aware portfolio shell for the connected wallet
│   ├── portfolio/[address]/page.tsx # Shareable portfolio route for any valid wallet address
│   ├── robots.ts                   # robots.txt via Next.js metadata API
│   ├── sitemap.ts                  # sitemap.xml with all public routes
│   ├── manifest.ts                 # PWA manifest (icons, theme, display)
│   ├── login/page.tsx              # Custom staging password screen when STAGING_PASSWORD is set
│   ├── .well-known/ai.json/route.ts # Machine-readable discovery metadata
│   └── api/
│       ├── route.ts                # API discovery document
│       ├── agents/register/route.ts # Agent registration
│       ├── agents/me/route.ts      # Bearer-authenticated agent lookup
│       ├── agents/claim/route.ts   # Human wallet claim endpoint
│       ├── skills/route.ts         # Skill catalog for agents
│       ├── explore/route.ts        # Explore queries + cache headers
│       ├── leaderboard/route.ts    # Trader leaderboard
│       ├── portfolio/route.ts      # Address-based Zora portfolio balances
│       └── staging-auth/route.ts   # Password check, sets the staging auth cookie
├── components/
│   ├── nav.tsx                     # Navigation bar (6 sections incl. Portfolio + wallet menu toggle)
│   ├── hero-section.tsx            # Hero layout with orb + CTA (animated highlighter headings)
│   ├── highlighter-stroke.tsx      # Reusable animated highlight sweep (motion/react backgroundSize)
│   ├── copyable-code-block.tsx     # Terminal-style command block with copy button
│   ├── home-get-started.tsx        # Homepage get-started steps section
│   ├── home-works-with.tsx         # Homepage works-with logos section
│   ├── hero-orb-glass.tsx          # Concrete dithered orb (R3F + spring click + velocity rotation)
│   ├── hero-orb-glass-loader.tsx   # Dynamic import wrapper (ssr: false)
│   ├── command-menu-loader.tsx     # Lazy client-only command menu mount
│   ├── home-live-cards.tsx         # Hydrated terminal market board with server initial data
│   ├── dashboard-tabs.tsx          # Client dashboard tabs + table refresh
│   ├── leaderboard-table.tsx       # Client leaderboard refresh wrapper
│   ├── skill-card-client.tsx       # Shared runtime picker + command blocks + typewriter example output
│   ├── coin-table.tsx              # Reusable coin data table
│   ├── portfolio-view.tsx          # Live portfolio balances, value stats, and installed skills
│   ├── portfolio-page-client.tsx   # Client wallet-aware portfolio entry state
│   ├── claim-form.tsx              # Dedicated agent-claim wallet form
│   ├── skill-card.tsx               # Unified skill card with install/remove states and peer-hover link
│   ├── wallet-menu.tsx             # Brutalist wallet dropdown (QR code, balance, copy address, disconnect)
│   ├── wallet-connect-modal.tsx     # Address entry modal for local Zora CLI wallets
│   ├── address-connect-form.tsx    # Reusable address input form for modal + portfolio page
│   ├── hover-media-overlay.tsx      # Viewport-centered token image overlay on table row hover (desktop only)
│   ├── activity-ticker.tsx         # Agent trade feed marquee (Simmer-style, mock data)
│   ├── activity-ticker-section.tsx # Activity ticker wrapper (imports mock trade data)
│   └── ui/                         # shadcn/ui components (button, card, badge, table, tabs, etc.)
├── public/
│   └── textures/                   # PBR texture maps (concrete diffuse/normal/roughness, env map)
└── lib/
    ├── data.ts                     # Cached server data helpers for pages and routes
    ├── discovery.ts                # Generated ai.json + llms docs
    ├── redis.ts                    # Direct Upstash Redis client wrapper
    ├── agents.ts                   # Agent record storage, key auth, and claim helpers
    ├── agent-auth.ts               # Bearer API key validation
    ├── site.ts                     # Site metadata and URL helpers
    ├── zora.ts                     # SDK wrapper: all query functions + formatting helpers
    ├── skills.ts                   # Static skill definitions (5 skills)
    ├── staging-auth.ts             # Shared staging auth token + redirect sanitization helpers
    ├── providers.tsx               # React Query provider (30s staleTime)
    ├── wallet-address.ts           # Shared 0x address validation helpers
    ├── wallet-context.tsx          # Address store (localStorage, useSyncExternalStore, skill seeding)
    ├── installed-skills-context.tsx # Installed skills store (localStorage, seed/clear on connect/disconnect)
    ├── utils.ts                    # cn() helper for className merging
    ├── pnl-utils.ts                # Shared PnL formatting (pnlColor, formatPnl, formatPct)
    ├── portfolio-mock-data.ts      # Mock portfolio data (positions, trades, sparkline) — used by agent ticker, not portfolio page
    ├── activity-mock-data.ts       # Mock agent trade entries for ticker marquee
    └── shaders/
        └── dither-effect.ts        # 4x4 Bayer matrix dithering post-process (binary output)
├── hooks/
│   ├── use-portfolio-data.ts       # React Query hook for SDK getProfileBalances
│   ├── use-has-hover.ts            # SSR-safe (pointer: fine) media query hook
│   ├── use-expandable-memory.ts    # Persist expand/collapse state across navigations
│   └── use-session-storage-state.ts # Generic session storage hook
├── proxy.ts                        # Custom staging auth gate for pages + CORS headers for /api/*
```

## Key decisions

- **Server components fetch initial data directly** through `src/lib/data.ts`, which wraps the SDK with `unstable_cache`. Mock fallbacks are allowed in non-production or when `ALLOW_MOCK_MARKET_DATA=true`, but production defaults to empty states instead of fabricated market data.
- **Staging auth is app-level, not Vercel-native** — when `STAGING_PASSWORD` is set, `src/proxy.ts` redirects visitor-facing pages to `/login`. The cookie stores a SHA-256 token of the password, not the raw password. Agent-facing routes (`/api`, `/api/*`, `/skills/[id]/skill-md`, `/.well-known/ai.json`, `/llms.txt`, `/llms-full.txt`), public claim links (`/claim/[code]`), and static public files stay accessible.
- **Client components still refresh through API routes** (`/api/explore`, `/api/leaderboard`) using React Query. The API remains the public integration surface for external agents and local tooling.
- **Agent discovery is explicit and host-aware** via `/api`, `/api/skills`, `/.well-known/ai.json`, `/llms.txt`, and `/llms-full.txt`. These are generated from App Router routes so they follow the current deployment host. `/.well-known/ai.json` now publishes the live `agent_registration_url`, `agent_me_url`, and `agent_claim_url` endpoints.
- **Agent registration uses direct Upstash Redis** — `src/lib/redis.ts` creates `new Redis({ url, token })` from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The repo does not use `@vercel/kv` or `Redis.fromEnv()` fallbacks. Agent records live under `agent:*`, bearer key lookups under `apikey:*`, and claim lookups under `claim:*`.
- **Claim URLs remain resolvable after success** — claim codes expire after 7 days while an agent is unclaimed. Once a wallet claims the agent, the `claim:*` lookup is rewritten without TTL so `/claim/[code]` can render an "already claimed" state. One-time claiming is enforced through `agent.status`, not by deleting the claim lookup.
- **Skills are static data** in `src/lib/skills.ts`. No database, no CMS. The homepage grid and skills gallery both render from this array — add a skill to the array and both pages update automatically.
- **Skills are managed runtimes behind the scenes**. Each public skill has a real `scripts/run.mjs`, `clawhub.json`, and source-backed manual install path. Those implementation details belong in internal docs, not primary marketing copy.
- **Install commands are shared** from `src/lib/skills.ts` (`getSkillRuntimeCommands()`, `getSkillQuickInstallCommands()`, `getInstallAllCommands()`) so the UI, `/api/skills`, and discovery docs stay in sync. `/api/skills` exposes both the full `install` map and the prompt-only `quickInstall` map. Claude Code is the default visible runtime because its prompt-based install helper works today. OpenClaw remains as a forward-looking tab, and the generated command map still includes a manual `git clone` fallback and a `curl` command for direct SKILL.md fetching. Curl is in `RuntimeCommands` but not in the `Runtime` type or UI tabs — it's a fetch method, not an agent runtime.
- **SKILL.md is served from the domain** at `/skills/[id]/skill-md` (`src/app/skills/[id]/skill-md/route.ts`). This gives agent commands clean URLs that work in any environment.
- **The skills page has a unified install card** — `RuntimeInstallCard` in `src/components/skill-card-client.tsx` combines 6 runtime tabs (OpenClaw, Claude Code, Amp, Codex CLI, OpenCode, Cursor) with a copyable code snippet in one bordered card. Claude Code is the default runtime. Per-skill rows use standalone `CopyableCodeBlock` components.
- **The skills page stays intentionally flat** — one shared runtime picker updates every command block. Supporting details are hidden behind a single `More info` disclosure that reveals commands and sample output together. No nested accordions.
- **Tabs use a single unified style** — `TabsList` always renders with `bg-muted p-1` (gray container) and selected tabs get black fill + white text. No variants — one style for all tab UIs (skills picker, homepage terminal, portfolio, dashboard). The preferred pattern is a wrapper `<div className="border-b border-border bg-muted p-1">` around `<TabsList className="grid ... bg-transparent p-0">`. **Gotcha:** The base `TabsList` component has `justify-center` baked in. `cn()` / tailwind-merge will NOT remove it when you pass `flex w-full` — you must explicitly add `justify-start` to left-align tabs, or use `grid` layout which avoids the issue.
- **Route-level `loading.tsx` files** exist for `/`, `/dashboard`, and `/leaderboard` — the three routes with async SDK fetches. These render instant skeleton states during navigation so the site feels like a fast SPA. Static pages (`/skills`, `/portfolio`) don't need them.
- **No `config.schema.json`** for skills. Config is documented inline in SKILL.md files, following AgentSkills/OpenClaw conventions. Runtime config (requires, tunables) lives in `clawhub.json`.
- **Command menu is lazy-loaded** through `src/components/command-menu-loader.tsx` so it does not affect the initial page payload.
- **React Query** handles live refresh after hydration. Initial render is server-owned for `/`, `/dashboard`, and `/leaderboard`.
- **Homepage "Agent activity" is a terminal board**, not a 4-card grid. It preloads 8 rows per tab, refreshes through `/api/explore` and `/api/leaderboard`, and uses a subtle CRT-style loading sweep plus simulated preview motion between fetches.
- **Activity ticker is illustrative** — the marquee uses mock trade entries from `src/lib/activity-mock-data.ts` and is labeled that way in the UI. It is a presentation surface, not a live trade feed yet.
- **Leaderboard uses the current SDK weekly shape** — `getTraderLeaderboard()` currently resolves to `data.exploreTraderLeaderboard`, with `weekVolumeUsd`, `weekTradesCount`, and `traderProfile.handle`. `src/lib/zora.ts` normalizes this into `TraderNode`.
- **Portfolio page uses live address-based balances** — `src/app/api/portfolio/route.ts` proxies the SDK `getProfileBalances()` query, `src/hooks/use-portfolio-data.ts` hydrates React Query clients, and `src/components/portfolio-view.tsx` renders current positions, total value, and 24h change from public on-chain data.
- **Wallet connect is address-only** — the modal at `src/components/wallet-connect-modal.tsx` accepts a wallet address from `zora wallet`, stores it locally, and seeds default skills. The `/claim/[code]` flow uses the same address-only model through `src/components/claim-form.tsx`. No signatures, nonces, or browser-side verification flow are involved because portfolio data is public and the agent ownership link is established server-side.
- **Portfolio is always reachable** — the nav always shows the Portfolio link. `/portfolio` uses the locally stored wallet address when present, and `/portfolio/[address]` renders any valid address directly for shareable lookups.
- **Wallet menu uses the same overlay pattern as the Index** — `fixed inset-0 z-[100]`, split backdrop/content transitions (200ms blur, 100ms content snap), rendered outside the `<header>` to avoid `inert` conflicts. Brutalist design: `gap-px` grid cells, QR code spanning rows, condensed bold `font-display` for balance.
- **Skill cards use `peer/link` for hover isolation** — `SkillCard` places an absolute `<Link>` as `peer/link` at z-0 and buttons at z-10. The card inverts on `peer-hover/link:` but button hover/click does not trigger the card's hover state.
- **PnL utilities are shared** — `src/lib/pnl-utils.ts` exports `pnlColor()`, `formatPnl()`, `formatPct()`. Gains = `#3FFF00`, losses = `#FF00F0`.
- **Market colors stay full-strength** — use `#3FFF00`, `#FF00F0`, or no market color at all. Only neutral grays should be faded with opacity.
- **Hover media overlay** — Inspired by hausotto.com. When hovering a coin row in `CoinTable` or `HomeLiveCards`, the token's `mediaContent.previewImage.medium` is shown as a large image centered on the viewport (`fixed inset-0 z-50`). Uses `pointer-events: none` so hover detection stays on the table rows. Disabled on touch devices via `(pointer: fine)` media query check in `useHasPointer()` hook (`useSyncExternalStore`-based, SSR-safe). The overlay fades in after the image loads (`loadedUrl === imageUrl` check prevents stale flashes). Mock data in `src/lib/mock-data.ts` includes picsum.photos URLs for dev testing.
- **Animated highlighter stroke** — `HighlighterStroke` component (`src/components/highlighter-stroke.tsx`) animates a `#3FFF00` background sweep left-to-right using motion/react `backgroundSize` with `ease-out-quint` easing, subtle `scaleY` press from bottom-left, and `-1.5deg` skew for a hand-drawn feel. Used on hero headings. The `.highlight-block` CSS class provides the static base styles (color, padding, `box-decoration-break: clone`); the component overrides `background-color` to transparent and drives the background via inline `backgroundImage` + animated `backgroundSize`. A `prefers-reduced-motion` CSS exemption in `globals.css` prevents the blanket `transition-duration: 0.01ms !important` rule from killing the motion/react animation. Portfolio stat numbers still use the static `.highlight-block` class directly.

## Tone of voice

All user-facing copy follows the guidelines in `TONE.md`. Key rules:

- Zora is an "attention market". Use this phrase as the definitive description.
- Attention Index helps agents use the Zora market. Do not imply the site is Zora, a hosted wallet, or a hosted execution layer.
- Short, direct sentences. Lead with the fact, not the framing.
- Market-first: trends, market scans, briefings, portfolios, momentum trading. Creator coins exist but are not the primary lens except on creator-specific surfaces.
- No promotional adjectives ("fast-moving", "powerful", "seamless").
- No forced rule-of-three lists. Use the natural number of items.
- No em dashes in marketing copy. Use commas or periods.
- No developer jargon in user-facing text ("execution-capable flows", "install surface").
- In public copy, avoid implementation words like `entrypoint`, `clawhub.json`, `manifest`, `cron loop`, and `env vars` unless the page is explicitly technical documentation.
- "Execution skills" not "execution-capable skills". "Points to" not "resolves to".
- Trust language must stay literal: "open source", "no custody", "some skills need a wallet", "trading is opt-in", "dry run by default".
- Speculation should be tasteful and optimistic, never overpromise.

## Animated buttons with icons

Buttons that contain icons must animate those icons on hover. Use `AnimatedButton` from `@/components/ui/animated-button` instead of the base `Button` or `buttonVariants` for any button with an icon child.

```tsx
import { AnimatedButton } from "@/components/ui/animated-button";
import { PlusIcon } from "@/components/ui/plus";

<AnimatedButton variant="outline" onClick={handleClick}>
  <PlusIcon size={14} />
  Add item
</AnimatedButton>;
```

The `AnimatedButton` component automatically detects icon children (components with `displayName` ending in "Icon") and wires their `startAnimation`/`stopAnimation` methods to mouse enter/leave events. The icons use motion/react for smooth animations.

For links styled as buttons with icons, use `AnimatedArrowLink` from `@/components/animated-arrow-link`. It accepts `variant` (default `"outline"`), `size`, and `className` props.

## shadcn/ui v2 — critical gotcha

shadcn/ui v2 uses `@base-ui/react` instead of Radix. The `Button` component does **not** support `asChild`.

Wrong:

```tsx
<Button asChild>
  <Link href="/foo">Go</Link>
</Button>
```

Correct:

```tsx
import { buttonVariants } from "@/components/ui/button-variants";

<Link href="/foo" className={buttonVariants({ variant: "outline" })}>
  Go
</Link>;
```

Import `buttonVariants` from `@/components/ui/button-variants` for server-safe usage with `<Link>`. The interactive `<Button>` component still lives in `@/components/ui/button`.

## Nav overlay transition pattern

The Index menu overlay uses split transitions for a snappy-but-smooth feel:

- **Content** (section grid + logo): `transition-[transform,opacity] duration-100 ease-out` — snaps in/out fast (100ms). High-frequency interaction = minimal animation per Emil's frequency principle.
- **Backdrop** (blur + tint): `transition-[opacity,backdrop-filter] duration-200 ease-out` — eases blur smoothly at 200ms. Blur filters need more time to avoid choppy rendering.
- **Navigation links**: `onClick` calls `navigateWithClose()` which closes the menu first, then fires `router.push()` after 100ms so the close transition completes before the page changes.

The parent wrapper has no transition — it only toggles `pointer-events`. Opacity lives on the content and backdrop independently so they can run at different speeds.

## Modal layering gotcha

The wallet connect modal hit a subtle CSS painting-order bug. Inside `src/components/wallet-connect-modal.tsx`, the backdrop is `absolute`. When the panel wrapper was non-positioned, the backdrop painted above it even though the panel markup came later in the DOM.

Fix: make the panel wrapper a positioned element with `relative`.

```tsx
<div className="relative flex h-full items-center justify-center pointer-events-none">
```

Do not assume DOM order alone will put modal content above an `absolute` sibling. If the backdrop and panel live in the same stacking context, make sure the panel container is positioned.

## SDK parameter inconsistencies

The `@zoralabs/coins-sdk` functions use different parameter names. These are documented here because they caused build failures during initial development:

| Function               | Parameters                    | Notes                                  |
| ---------------------- | ----------------------------- | -------------------------------------- |
| `getTrendingAll`       | `{ count }`                   |                                        |
| `getCoinsMostValuable` | `{ count }`                   |                                        |
| `getCoinsNew`          | `{ count }`                   |                                        |
| `getCoinsTopVolume24h` | `{ count }`                   |                                        |
| `getCoinsTopGainers`   | `{ count }`                   |                                        |
| `getCreatorCoins`      | `{ count }`                   |                                        |
| `getFeaturedCreators`  | `{ first }`                   | NOT `count`                            |
| `getTraderLeaderboard` | `{ first }`                   | NOT `count`                            |
| `getCoin`              | `{ address, chain }`          | chain is number (8453 for Base)        |
| `getCoinSwaps`         | `{ address, chain, first }`   | `chain` is number, `first` not `count` |
| `getCoinHolders`       | `{ chainId, address, count }` | `chainId` not `chain`                  |
| `getProfileBalances`   | `{ identifier, count, sortOption?, excludeHidden?, chainIds? }` | `identifier` is wallet address. We pass `sortOption: "MARKET_VALUE_USD"`, `excludeHidden: true`, `chainIds: [8453]` |
| `getProfileCoins`      | `{ identifier, count }`       | `identifier` is wallet address         |

All SDK responses return `{ error, data }`. Always check `response.error` before accessing data.

## Skills

5 first-party verified skills:

1. **Trend Scout** — trending topic coins, new trend launches, volume and mcap leaders
2. **Creator Pulse** — creator coin ecosystems, featured creators, watchlists
3. **Briefing Bot** — structured morning/evening market digest
4. **Portfolio Scout** — coin holdings via CLI (local wallet) or SDK (any address). Bankr-ready bridge skill
5. **Momentum Trader** — quotes and manages momentum trades via the Zora CLI. Dry run by default, requires a dedicated trader wallet created with `zora setup`.

Skills 1–4 are read-only. Skills 1–3 do not need a wallet. Portfolio Scout and Momentum Trader do. Skill 5 is the only trading skill and stays dry-run by default until explicitly enabled. All use OpenClaw SKILL.md format. The CLI has no SKILL.md parsing, it's purely an agent-runtime convention.

### Skill directory structure

Each skill follows the AgentSkills/ClawHub directory convention:

```
<skill-slug>/
├── SKILL.md          # AgentSkills-compliant metadata + agent instructions
├── clawhub.json      # ClawHub registry config (requires, tunables, cron)
└── scripts/
    ├── run.mjs       # Managed runtime entrypoint
    └── validate.sh   # Host-readiness validation script
```

**SKILL.md frontmatter** uses the AgentSkills format — flat `metadata` strings only:

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

Do NOT put `requires`, `tunables`, or `openclaw` in SKILL.md frontmatter — those go in `clawhub.json`.

**SKILL.md body** must contain these 8 sections in order:

1. `## When to Use This Skill`
2. `## Setup`
3. `## Configuration`
4. `## Commands`
5. `## How It Works`
6. `## Example Output`
7. `## Troubleshooting`
8. `## Important Notes`

**clawhub.json** structure:

- All skills use a managed entrypoint: `automaton.managed: true`, `automaton.entrypoint: "scripts/run.mjs"`
- All skills require `zora` and `node` in `requires.bins`
- Wallet-backed skills add `requires.env: ["ZORA_PRIVATE_KEY"]`
- Tunables live in `clawhub.json`, not SKILL.md frontmatter

### Skill testing

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before merge. `pnpm test` validates all skills against the AgentSkills spec. Tests cover:

- SKILL.md frontmatter fields and format
- Required body sections present
- Word count 300–800 per skill
- CLI flag correctness (all commands use `--json`)
- Managed `clawhub.json` metadata (`automaton`, cron, tunables, env requirements)
- Cross-file sync (skills.ts IDs match SKILL.md names and directory names)
- Process-level managed entrypoint behavior via `src/__tests__/skill-entrypoints.test.ts` with a stubbed `zora` binary, isolated `HOME`, and state/journal assertions
- Execution skill safety (dry-run journal writes, no accidental `--yes`, live exit path, env requirements)

`scripts/validate.sh` remains a separate host-readiness check. Run it from inside the skill directory so its relative `scripts/run.mjs` path resolves correctly. It requires the installed `zora` CLI to be on your shell `PATH`, which means `command -v zora` and `zora --help` should both succeed. The managed tests do not prove that, because `pnpm test` injects a stub `zora` command for integration coverage. Wallet-backed skills also require a configured wallet.

### CLI commands

The Zora CLI has 8 commands: `auth`, `explore`, `get`, `buy`, `sell`, `balance`, `setup`, `wallet`.

| Command        | Syntax                                           | Notes                                                                                                                                                                |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zora explore` | `--sort <sort> --type <type> --limit <n> --json` | Sorts: mcap, volume, new, gainers, trending, featured, last-traded, last-traded-unique. Types: all, trend, creator-coin, post                                        |
| `zora get`     | `zora get <identifier> [--type <type>] --json`   | Identifier = 0x address or supported coin or creator name. NOT ENS. Types: creator-coin, post, trend                                                                  |
| `zora buy`     | `zora buy <address> --eth <amount> --json`   | Requires 0x address, does not resolve names. Also: --usd, --token (eth/usdc/zora), --percent, --all, --quote (preview only), --yes (skip confirm), --slippage, --debug |
| `zora sell`    | `zora sell <address> --amount <tokens> --json` | Requires 0x address, does not resolve names. Also: --usd, --token (alias for --to), --percent, --all, --to <ETH\|USDC\|ZORA>, --quote, --yes, --slippage, --debug    |
| `zora balance` | `zora balance [spendable\|coins] --json`         | Subcommands: (none) = wallet + coins, `spendable` = ETH/USDC/ZORA only, `coins` = coin holdings with --sort                                                          |
| `zora setup`   | `zora setup [--create] [--force]`                | Creates/imports wallet at ~/.config/zora/wallet.json                                                                                                                 |
| `zora wallet`  | `wallet info`, `wallet export`, `wallet backup`  | Wallet inspection, export, and Keychain backup on macOS                                                                                                              |
| `zora auth`    | `auth configure`, `auth status`                  | API key management                                                                                                                                                   |

**CLI behavioral notes:**

- `--json` output is clean stdout. Errors go to stderr. In JSON mode, errors are also structured: `{"error": "...", "suggestion": "..."}`.
- Exit codes: 0 = success (including user abort), 1 = all errors.
- `--yes` skips the trade confirmation prompt only. Validation (API key, wallet, balance checks) still runs.
- `--sort` and `--type` combine (e.g., `--sort trending --type creator-coin`). Invalid combos return a clear error. Some sorts (`gainers`, `last-traded`, `last-traded-unique`) only support `--type post`.
- `buy` and `sell` require a 0x contract address. They do not resolve names. Use `zora get <name> --json` to resolve the address first, then pass it to the trade command.
- `zora get` returns `uniqueHolders` and `volume24h` but NOT swaps or detailed holder list. Use SDK `getCoinHolders`/`getCoinSwaps` for those.
- No watch/streaming mode. Single request, single response, exit.

**CLI JSON output shapes:**

- `explore --json`: `{ coins: [{ name, address, coinType, marketCap, volume24h, marketCapDelta24h }], pageInfo: { endCursor, hasNextPage } }`
- `get --json`: `{ name, address, coinType, marketCap, volume24h, uniqueHolders, createdAt, creatorAddress, creatorHandle }`
- `balance --json`: `{ wallet: [{ symbol, balance, usdValue, priceUsd }], coins: [{ rank, name, symbol, balance, usdValue, priceUsd, marketCap, marketCapChange24h, volume24h }] }`
- `buy --json`: `{ action, coin, address, spent: { amount, raw, symbol }, received: { amount, raw, symbol }, tx }` — `--quote` returns `estimated` and `slippage` instead of `received`/`tx`
- `sell --json`: `{ action, coin, address, sold: { amount, raw, symbol }, received: { amount, raw, symbol, source }, tx }` — `--quote` returns `estimated` and `slippage` instead

**`zora balance` subcommands:**

- `zora balance` — returns both wallet tokens (ETH/USDC/ZORA) and coin positions
- `zora balance spendable` — ETH/USDC/ZORA balances only
- `zora balance coins` — coin holdings with sorting (--sort usd-value, balance, market-cap, price-change)
- **Local wallet only** — reads from configured private key, no address argument.
- For arbitrary wallet lookups, use SDK (`getProfileBalances`, `getProfileCoins`).
- Portfolio Scout wraps `zora balance` for the local wallet, SDK for any address.

### Wallet setup

- `zora setup` creates a new EOA keypair or imports an existing private key
- Keys stored at `~/.config/zora/wallet.json` (mode 0600)
- `ZORA_PRIVATE_KEY` env var takes precedence over stored wallet
- On macOS, `zora wallet backup` stores a recoverable backup in Keychain
- `--create` skips interactive prompt, `--force` overwrites existing wallet
- **No spending limits or scope restrictions** — it's a raw private key

## Agent-facing endpoints

- `/api` — discovery document listing public endpoints
- `/api/skills` — full skill catalog JSON
- `/api/skills?id=<skill-id>` — single skill lookup
- `/api/explore` — live explore data with cache headers
- `/api/leaderboard` — leaderboard data with cache headers
- `/api/portfolio?address=0x...` — public coin balances for any wallet address (SDK `getProfileBalances`)
- `/skills/<id>/skill-md` — raw SKILL.md content (`text/markdown`, 1h cache)
- `/.well-known/ai.json` — simple discovery document for crawlers and agents

## Product boundaries

- Execution skills (Momentum Trader) run locally via Zora CLI — we don't execute trades server-side
- No custody or key management
- No server-side enforcement or guardrails
- No third-party skill submissions
- No paid features or tokens
- Verification = we reviewed the source. Does not mean we control local runtime.
