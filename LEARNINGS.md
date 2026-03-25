# Learnings

Decisions, trade-offs, and context that aren't obvious from the code.

## 2026-03-25 — SIWE wallet connect via Zora CLI

### Browser stays read-only, CLI owns the key
The wallet connect flow uses SIWE (Sign-In with Ethereum) signed in the terminal via `zora auth connect`, not a browser extension. The browser never sees the private key. This matches the project's "no custody" principle and works for CLI-native wallets created with `zora setup`.

### Site-issued nonce, not CLI-issued timestamp
The challenge nonce is generated server-side per `POST /api/wallet/challenge` with a 5-minute TTL. This gives clean replay protection and makes a future server-backed session (e.g. httpOnly cookie) straightforward. A CLI-issued timestamp would be harder to verify and easier to replay.

### Nonce replay protection uses an in-memory store
The current nonce store is a `Map<string, NonceRecord>` in `wallet-auth.ts`. This works for single-instance Vercel deployments but won't survive across serverless invocations at scale. When that matters, swap to a KV store (Vercel KV, Upstash Redis). The interface is already isolated.

### viem is a direct dependency now
Added `viem@^2.22.12` as a direct dependency to match the Zora SDK peer expectation. This gives us `verifyMessage`, `createPublicClient`, and the SIWE message parsing we need for signature verification without pulling in a separate SIWE library.

## 2026-03-24 — Market-first copy system

### Public copy should lead with jobs, not internals
The clearer structure for this site is: what the skill helps with, what the user can do with it, then any trust or setup detail. Visitors should first see trends, briefings, portfolios, and momentum trading, not `entrypoint`, `clawhub.json`, or other runtime plumbing.

### Attention Index is not Zora
The site should be framed as the place to install and inspect market skills for the Zora attention market. It is not the market itself, not a wallet product, and not a hosted execution layer. That distinction needs to stay explicit in homepage copy, metadata, and trust language.

### Trust copy must stay literal
The strongest trust claims here are plain ones: open source, no custody, some skills need a wallet, trading is opt-in, dry run by default. Broader statements like "No keys" or vague safety language create drift because they stop being true as soon as a trading skill or wallet-backed skill is in view.

## 2026-03-24 — Custom staging auth gate

### The gate has to live in the app
This Vercel project cannot rely on native Vercel password protection, so the staging gate has to be enforced in the Next.js app itself. `STAGING_PASSWORD` turns on a redirect to `/login` for visitor-facing pages.

### Agent surfaces stay public on purpose
The gate should not block `/api`, `/api/*`, `/skills/[id]/skill-md`, `/.well-known/ai.json`, or static public files. Those routes are part of agent install and discovery flows. The goal is to protect the human-facing site shell, not to break skill consumption.

### The cookie should not store the raw password
The initial login loop came from a fragile client redirect flow. The safer model is: hash the configured password into a stable token, set that token in an HTTP-only cookie, then do a full page navigation after successful login so the next request is evaluated server-side with the cookie in place.

## 2026-03-23 — Stakeholder-ready install surface

### Default to a runtime that actually works
The top-level install surface should default to an executable path, not a placeholder. Claude Code is the best current default because the `claude -p "Read <url>..."` commands are usable today. OpenClaw can stay as a forward-looking runtime tab, but it should not be the first command stakeholders see.

### Skill rows scan better when supporting detail is hidden
The automation/schedule/needs/category grid added too much visual bookkeeping. The stronger hierarchy is: what the skill does, when to use it, how to install it, then an optional `More info` disclosure for commands and sample output. This keeps the page readable without removing depth entirely.

## 2026-03-19 — Unified install card + runtime tabs

### TabsList base class override
The shadcn/ui `TabsList` component applies `gap-1 bg-muted p-1` in its base className. When overriding with `bg-transparent p-0`, the `gap-1` still applies unless explicitly zeroed with `gap-0`. This created a visible gap on the left side of the first tab in the `RuntimeInstallCard`. Always override all three properties (`gap-0 bg-transparent p-0`) when restyling `TabsList` as a flush container.

### Install commands are agent prompts, not shell commands
The Zora CLI has no `install` or `skills` subcommand. What we call "install" is actually a prompt instruction: `claude -p "Read <url> and <action>"`. The SKILL.md is served from the domain at `/skills/[id]/skill-md` so URLs work in all environments. OpenClaw can remain as a runtime tab, but it should be treated as a forward-looking path rather than the default install surface.

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
