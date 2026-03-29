# Learnings

Decisions, trade-offs, and context that aren't obvious from the code.

## 2026-03-29 — Agent-first install copy

### Generic trust boilerplate drifts fast
Lines like "open source", "no custody", "some skills need a wallet", and "trading is opt-in" looked tidy, but they quickly became filler or inaccurate on the wrong surface. The better rule is: say the smallest true thing for that page. If wallet requirements differ, name the skills.

### Repetition is the fastest AI tell
One "Paste this to your agent." at the shared install surface works. Repeating it on every skill row makes the page feel templated. Let the command block, source link, and skill notes carry the row once the shared instruction is already clear.

### Explain Zora CLI by what it does
"Market reads" and "locally" were both weaker than they sounded. "Market data and balance checks" says more, and trading skills also place orders through the CLI.

## 2026-03-29 — Live deploy workflow

### Start direct deploys from a clean `origin/main` base
This workspace was behind production. Creating a clean worktree from `origin/main` let us port the copy changes without rolling back the newer merged PR. If a workspace branch is not the live base, do not push from it directly.

## 2026-03-27 — Direct Upstash agent registration + wallet claiming

### Use direct `@upstash/redis`, not `@vercel/kv`
The Redis client should be instantiated explicitly with `new Redis({ url, token })` from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. `Redis.fromEnv()` accepts legacy `KV_REST_*` fallbacks, which would blur the storage contract we want to keep explicit.

### Claim links should survive successful claims
Deleting the claim lookup on success makes `/claim/[code]` useless for humans and agents that revisit the link later. The better rule is: keep `claim:{code} -> agent_id`, remove the TTL after a successful claim, and enforce one-time claiming through `agent.status`.

### Address-only claiming stays consistent with portfolio lookups
The browser claim flow uses the same plain `0x` address entry model as the portfolio page. That keeps the UX consistent and avoids adding browser wallet signing until there is a stronger ownership requirement than "link this agent to that address".

## 2026-03-27 — Production hardening + truthful discovery

### Discovery docs should come from routes, not `public/`
Static `public/llms.txt`, `public/llms-full.txt`, and `public/.well-known/ai.json` drift as soon as the hostname changes. Generating them from App Router handlers keeps discovery tied to the current request host and lets the site survive a future custom domain without another code edit.

### Production should not silently fall back to fabricated market data
Mock data is useful for local design work and SDK outages during development, but it is misleading in a production surface that claims to show live market state. The safer rule is: allow mock fallbacks only outside production, or behind an explicit `ALLOW_MOCK_MARKET_DATA=true` flag.

### The leaderboard response shape is not the one the old wrapper assumed
`getTraderLeaderboard()` currently returns `data.exploreTraderLeaderboard` with weekly fields like `weekVolumeUsd`, `weekTradesCount`, and `traderProfile.handle`. Treat `src/lib/zora.ts` as the canonical normalization layer, because the raw SDK shape can change underneath the UI.

### `scripts/validate.sh` assumes the skill directory as the working directory
Each per-skill validator checks `scripts/run.mjs` using a relative path. Running `./trend-scout/scripts/validate.sh` from the repo root will fail even though the skill is fine. Run `./scripts/validate.sh` from inside the skill directory, or change the script to resolve relative to its own location if we ever want root-level orchestration.

## 2026-03-27 — Address-based portfolio (SIWE removed)

### Portfolio data is public, no signature needed
The original SIWE flow authenticated the CLI to the web, which is backwards. Portfolio data (coin balances, values, 24h changes) is all public on-chain data queryable via `getProfileBalances()`. Users just paste their CLI wallet address (`zora wallet`) and the site looks everything up. No challenge, no nonce, no signature verification.

### SIWE was solving the wrong problem
The Simmer reference model auths the web to the agent, not the other way around. The agent is the primary actor. For read-only portfolio views, even that isn't needed — a plain address is sufficient. That logic carried into the later claim flow: the agent registers itself server-side, then the human completes ownership by visiting a claim link and entering the wallet address that should own the profile.

### Address validation is the only gate
The wallet context now stores a plain `0x` address string in localStorage. The only validation is format checking (`/^0x[a-fA-F0-9]{40}$/`). This is intentional — anyone can look up any address, same as on Etherscan. The connect flow seeds default skills and the disconnect flow clears them.

### Shareable portfolio URLs matter
`/portfolio/[address]` enables the CLI to generate direct links to agent portfolios. This became part of the claim flow: after a successful claim, the browser redirects to `/portfolio/[address]`, and an old claim link can still point the human back to the claimed wallet.

## 2026-03-24 — Market-first copy system

### Public copy should lead with jobs, not internals
The clearer structure for this site is: what the skill helps with, what the user can do with it, then any trust or setup detail. Visitors should first see trends, briefings, portfolios, and momentum trading, not `entrypoint`, `clawhub.json`, or other runtime plumbing.

### Attention Index is not Zora
The site should be framed as the place to install and inspect market skills for the Zora attention market. It is not the market itself, not a wallet product, and not a hosted execution layer. That distinction needs to stay explicit in homepage copy, metadata, and trust language.

### Trust copy should stay precise
Generic safety lines age badly. Say only what is true on that surface, name the skills when wallet needs differ, and avoid filler like "no custody" when it adds no information.

## 2026-03-24 — Custom staging auth gate

### The gate has to live in the app
This Vercel project cannot rely on native Vercel password protection, so the staging gate has to be enforced in the Next.js app itself. `STAGING_PASSWORD` turns on a redirect to `/login` for visitor-facing pages.

### Agent surfaces stay public on purpose
The gate should not block `/api`, `/api/*`, `/skills/[id]/skill-md`, `/.well-known/ai.json`, or static public files. Those routes are part of agent install and discovery flows. The goal is to protect the human-facing site shell, not to break skill consumption.

### The cookie should not store the raw password
The initial login loop came from a fragile client redirect flow. The safer model is: hash the configured password into a stable token, set that token in an HTTP-only cookie, then do a full page navigation after successful login so the next request is evaluated server-side with the cookie in place.

## 2026-03-23 — Stakeholder-ready install surface

### Default to a prompt any agent can follow
The top-level install surface should default to the broadest working instruction, not the narrowest runtime wrapper. A plain prompt that points at `llms.txt` works across agents. Runtime-specific wrappers can stay in tabs, but they should not be the first thing every visitor sees.

### Skill rows scan better when supporting detail is hidden
The automation/schedule/needs/category grid added too much visual bookkeeping. The stronger hierarchy is: what the skill does, when to use it, how to install it, then an optional `More info` disclosure for commands and sample output. This keeps the page readable without removing depth entirely.

## 2026-03-19 — Unified install card + runtime tabs

### TabsList base class override
The shadcn/ui `TabsList` component applies `gap-1 bg-muted p-1` in its base className. When overriding with `bg-transparent p-0`, the `gap-1` still applies unless explicitly zeroed with `gap-0`. This created a visible gap on the left side of the first tab in the `RuntimeInstallCard`. Always override all three properties (`gap-0 bg-transparent p-0`) when restyling `TabsList` as a flush container.

### Install commands are agent prompts, not shell commands
The Zora CLI has no `install` or `skills` subcommand. What we call "install" is an instruction for an agent, either as a plain prompt or as a runtime wrapper like `claude -p "Install <skill> from <url>"`. The SKILL.md is served from the domain at `/skills/[id]/skill-md` so URLs work in all environments.

### Activity ticker belongs in root layout
The ticker was originally homepage-only, then moved to `HeroSection`. It makes more sense in the root layout directly under the nav so it appears on every page without each page importing it. Borders were removed since the nav already provides a visual boundary above.

## 2026-03-17 — Wallet modal painting order

### DOM order was misleading
The wallet modal backdrop and panel sit next to each other in the same portal root. The backdrop is `absolute`, but the panel wrapper was initially non-positioned. In that setup, the backdrop painted above the panel even though the panel came later in the JSX.

### The fix was `relative`, not more `z-index`
Adding `relative` to the panel wrapper in `src/components/wallet-connect-modal.tsx` made it a positioned element in the same painting category as the backdrop. Since the panel wrapper comes after the backdrop in DOM order, it now paints on top. The bug was not the modal's portal or its `z-[150]` value.

### Future rule for modal shells
If a modal backdrop is `absolute` or `fixed`, make the panel container positioned as well. Do not rely on sibling order between positioned and non-positioned elements to control which layer appears on top.

## 2026-03-17 — Zora CLI integration + Momentum Trader

### Install commands are CLI-first now
We moved away from fake package-install syntax to runtime-specific prompt helpers that point to hosted SKILL.md files and source-backed entrypoints. The install surface is about giving each agent runtime enough context to mirror the skill locally, not pretending these skills are published packages.

### Momentum Trader is the first execution skill
All prior skills were `risk: "none"` / read-only. Momentum Trader is `risk: "medium"` and wraps `zora buy` / `zora sell`. The trust page's "Trader" wallet preset already covers the safety model (bounded funds, dedicated wallet). The skill references `zora setup` for wallet creation — the CLI creates its own EOA, not a Bankr or Privy wallet.

### Badge styling for execution skills
"Execution" badge uses `bg-amber-500/20 text-amber-300 border-amber-500/30` to stand out from read-only `outline` badges. Initial version used `text-amber-500` which failed WCAG contrast (~2.1:1) — `text-amber-300` passes at 4.5:1 on dark backgrounds. This is a simple string match (`badge === "Execution"`) in both `skill-card-client.tsx` and `page.tsx`. If we add more execution skills, the same pattern applies automatically.

### Hover-only state changes need keyboard parity
The install button's "Installed" → "Remove" label swap originally only triggered on `onMouseEnter`/`onMouseLeave`. Keyboard and screen reader users couldn't discover the remove action. Fixed by adding `onFocus`/`onBlur` + `focus-visible` CSS + a permanent `aria-label`. Any future hover-dependent UI changes should always mirror with focus handlers.

### Bankr vs Zora CLI wallet
Initially designed Momentum Trader around Bankr's swap primitives. Updated to reference the Zora CLI's native wallet and buy/sell commands since the CLI creates its own EOA during setup. Bankr remains relevant as an alternative execution backend but isn't the primary path.

### Runtime command maps should stay stable
The `/api/skills` response and UI both read from the same runtime command helpers in `src/lib/skills.ts`. When install behavior changes, update the shared command map first so the site, metadata, and agent-facing API stay aligned.
