# Zora Agent Skills

Agent skills and live market data for the Zora attention market. Scan trends, check portfolios, build briefings, and trade momentum.

Agent discovery is available through `/.well-known/ai.json`, `/llms.txt`, `/llms-full.txt`, and `/api/skills`. The shortest install prompts point agents at the hosted `llms.txt` or per-skill `skill-md` URLs. The public install copy is agent-first: paste the prompt to your agent or send it the hosted URL. Agent self-registration and human wallet claiming are live at `/api/agents/register`, `/api/agents/me`, `/api/agents/claim`, and `/claim/<code>`.

## Quick start

```bash
git clone git@github.com:fraser-stanley/zora-agent-skills.git
cd zora-agent-skills
pnpm install
pnpm dev
```

Open http://localhost:3000.

If `STAGING_PASSWORD` is set, the app redirects visitor-facing pages to `/login` first. Agent-facing routes and `/claim/<code>` stay public so installs, discovery, and claiming still work.

## Skills

Six skills for the Zora market. Each skill directory contains:

- `SKILL.md` for agent-facing instructions
- `clawhub.json` for runtime metadata, cron, env, and tunables
- `scripts/run.mjs` as the managed entrypoint
- `scripts/validate.sh` for host-readiness validation

| Skill                               | Description                                                             | Type      |
| ----------------------------------- | ----------------------------------------------------------------------- | --------- |
| [trend-scout](trend-scout/)         | Tracks trend leaders, new entrants, and volume shifts                   | Read-only |
| [creator-pulse](creator-pulse/)     | Tracks creator-coin leaders and watchlist moves                         | Read-only |
| [briefing-bot](briefing-bot/)       | Turns the market into a short briefing                                  | Read-only |
| [portfolio-scout](portfolio-scout/) | Checks balances, position changes, and concentration                    | Read-only |
| [copy-trader](copy-trader/)         | Mirrors public Zora wallet moves with guardrails. Dry run by default    | Execution |
| [momentum-trader](momentum-trader/) | Quotes and manages momentum trades. Dry run by default                  | Execution |

Trend Scout, Creator Pulse, and Briefing Bot do not need a wallet. Portfolio Scout can inspect any address through the public API, and its local wallet mode uses `zora balance`. Copy Trader and Momentum Trader need a dedicated wallet configured through `zora setup` or `ZORA_PRIVATE_KEY`. If you create that wallet locally on macOS, run `zora wallet backup` after setup.

## API

Agent-facing endpoints. All responses include cache headers.

| Endpoint                    | Description                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /api`                  | Discovery document                                                                               |
| `GET /api/skills`           | Skill catalog (`?id=<skill-id>` for single lookup), including `install` and `quickInstall` maps |
| `GET /api/explore`          | Live coin data (`?sort=trending\|mcap\|new\|volume\|gainers\|creators\|featured`, `?count=1-20`) |
| `GET /api/leaderboard`      | Weekly trader rankings by Zora volume (`?count=1-50`)                                            |
| `GET /api/portfolio`        | Public portfolio lookup (`?address=<0x-address>&count=1-50`)                                     |
| `GET /api/profile`          | Resolve a profile handle or wallet to a canonical public wallet (`?identifier=<0x-or-handle>`)   |
| `GET /api/coin-swaps`       | Recent swap activity for one coin (`?address=<0x-coin>&count=1-50&after=<cursor>`)               |
| `POST /api/agents/register` | Register an agent and receive a bearer API key plus a claim URL                                  |
| `GET /api/agents/me`        | Resolve the current agent record with `Authorization: Bearer sk_zora_*`                          |
| `POST /api/agents/claim`    | Claim an unclaimed agent with `{ claim_code, wallet }`                                           |
| `GET /claim/<code>`         | Public claim page, including unconfigured, claimable, claimed, and suspended states              |
| `GET /skills/<id>/skill-md` | Raw SKILL.md content for agent consumption                                                       |
| `GET /llms.txt`             | Short agent-readable docs                                                                        |
| `GET /llms-full.txt`        | Full agent-readable docs                                                                         |
| `GET /.well-known/ai.json`  | Agent discovery metadata                                                                         |

`POST /api/agents/register` is IP-rate-limited to 5 requests per 10 minutes. `POST /api/agents/claim` is IP-rate-limited to 10 requests per 10 minutes. Both return `429` with `Retry-After` and `X-RateLimit-*` headers when exceeded.

### Paste to your agent

Default all-skills prompt:

```bash
Read the skill docs at https://<host>/llms.txt and follow the install instructions.
```

Runtime-specific helper:

```bash
claude -p "Install skills from https://<host>/llms.txt"
```

Single skill:

```bash
Read the skill doc at https://<host>/skills/trend-scout/skill-md and follow the install instructions.
```

## Project structure

```
trend-scout/           Skill directories (SKILL.md + clawhub.json + scripts/)
creator-pulse/
briefing-bot/
portfolio-scout/
copy-trader/
momentum-trader/
src/
├── app/               Pages and API routes
│   ├── api/           Agent-facing endpoints
│   ├── .well-known/   Dynamic discovery route
│   ├── dashboard/     Tabbed explore view
│   ├── skills/        Skill gallery
│   ├── leaderboard/   Weekly trader rankings
│   ├── llms.txt/      Short discovery docs
│   ├── llms-full.txt/ Full discovery docs
│   ├── portfolio/     Portfolio view
│   └── login/         Staging password gate
├── components/        UI components (nav, tables, skill cards, shadcn/ui)
└── lib/               SDK wrapper, discovery builders, skill data, utilities
```

## Development

```bash
pnpm dev          # dev server at localhost:3000
pnpm typecheck    # direct TypeScript check (tsc --noEmit)
pnpm lint         # eslint
pnpm test         # vitest, including managed skill entrypoint integration
pnpm build        # production build (TypeScript + Next.js compilation)
```

Merge gate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

`pnpm build` remains the primary production verification gate, while `src/__tests__/skill-entrypoints.test.ts` covers the managed `scripts/run.mjs` workers with a stubbed `zora` binary, isolated `HOME`, and state/journal assertions. Run each skill's `./scripts/validate.sh` from inside that skill directory. Those checks still require the installed `zora` CLI to be on your shell `PATH`, and wallet-backed skills also require a configured wallet.

## Environment

| Variable                    | Required        | Description                                                          |
| --------------------------- | --------------- | -------------------------------------------------------------------- |
| `ZORA_API_KEY`              | No              | Higher rate limits. Get one at https://zora.co/settings/developer    |
| `ZORA_PRIVATE_KEY`          | Skill-dependent | Needed for wallet-backed skills and live trading                     |
| `UPSTASH_REDIS_REST_URL`    | Agent flow      | Direct Upstash Redis REST URL for agent registration and claiming    |
| `UPSTASH_REDIS_REST_TOKEN`  | Agent flow      | Direct Upstash Redis REST token for agent registration and claiming  |
| `STAGING_PASSWORD`          | No              | Enables the custom app-level password gate for visitor pages         |
| `NEXT_PUBLIC_SITE_URL`      | No              | Canonical site URL for metadata, sitemap, and install prompts        |
| `NEXT_PUBLIC_SITE_REPO_URL` | No              | Public repo URL used in skill source links and manual clone commands |
| `NEXT_PUBLIC_SITE_REPO_REF` | No              | Repo ref used for source links, defaults to `main`                   |
| `ALLOW_MOCK_MARKET_DATA`    | No              | Set to `true` only if you intentionally want mock market fallback    |

Skill-specific env vars and tunables live in each `clawhub.json`. Copy Trader and Momentum Trader are dry-run by default and only go live when `ZORA_COPYTRADE_LIVE=true` or `ZORA_MOMENTUM_LIVE=true`.

Agent registration uses direct `@upstash/redis`. Only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are supported. This repo does not use `@vercel/kv` or `KV_REST_*` fallbacks for the claim flow.

## Deploy

Shared staging lives on the Vercel project `zoraskills-staging` in the `frasers-projects-053d31c6` scope. `https://zoraskills-staging.vercel.app/` is that project's production alias, so staging updates need a production deploy:

```bash
vercel link --yes --scope frasers-projects-053d31c6 --project zoraskills-staging
vercel deploy --prod --yes --scope frasers-projects-053d31c6
```

Check `.vercel/project.json` before deploying if you switch between workspaces, otherwise `vercel` may publish to the wrong project.

For an ad hoc preview deploy:

```bash
vercel
```

For a stakeholder build on Vercel:

- Set `ZORA_API_KEY` for better rate limits. The app still builds safely without it.
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` if the deployment should support agent registration and human wallet claiming.
- Set `STAGING_PASSWORD` if the deployment should stay behind the repo's custom password gate. This protects visitor-facing pages at `/login` because the project cannot use Vercel's native password protection on the current plan.
- Set `NEXT_PUBLIC_SITE_URL` when you know the public hostname. The discovery docs are host-aware at runtime, but canonical metadata should still use the intended site URL.
- Set `NEXT_PUBLIC_SITE_REPO_URL` and `NEXT_PUBLIC_SITE_REPO_REF` when the public skills repo is ready.
- You do not need `ZORA_PRIVATE_KEY` unless you are testing wallet-backed skills or live trading flows.
- `/dashboard` and `/leaderboard` use live SDK data. Mock fallback is disabled in production unless `ALLOW_MOCK_MARKET_DATA=true` is set intentionally.
- The wallet connect flow is address-only. Users paste the address from their local Zora CLI wallet. The homepage activity ticker uses live `/api/activity` data and falls back to loading, empty, or unavailable states instead of fabricated production trades.
- Agent-facing routes stay public when the gate is on: `/api`, `/api/*`, `/skills/<id>/skill-md`, `/.well-known/ai.json`, `/llms.txt`, `/llms-full.txt`, `/claim/<code>`, and static public files.

## Documentation

| File                         | Purpose                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)       | Full project reference: architecture, SDK details, CLI commands, key decisions |
| [AGENTS.md](AGENTS.md)       | Agent contributor guide: SDK queries, pitfalls, how to add skills/pages        |
| [TONE.md](TONE.md)           | Copy guidelines, market-first framing, and Zora brand principles               |
| [LEARNINGS.md](LEARNINGS.md) | Architectural decisions and trade-offs                                         |
| [CHANGELOG.md](CHANGELOG.md) | Release history                                                                |

## Tech stack

Next.js 16, TypeScript (strict), Tailwind CSS v4, shadcn/ui v2, React Query, @zoralabs/coins-sdk, motion/react, Three.js

## License

Private
