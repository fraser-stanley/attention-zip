# Changelog

## 2026-03-25 (SIWE wallet connect)

### Added
- **Real wallet connect flow** — replaced the mock MetaMask/Coinbase/WalletConnect modal with a SIWE-based Zora CLI connect flow. The site issues a per-origin challenge nonce, the user runs `zora auth connect` in their terminal, and pastes the signed token back to verify wallet ownership.
- **`/api/wallet/challenge`** — issues a SIWE challenge with nonce, expiry, and a ready-to-copy CLI command.
- **`/api/wallet/verify`** — verifies the signed SIWE token with nonce TTL, replay protection, origin binding, Base chain (8453), statement matching, and signature verification via viem.
- **Auth core** — `src/lib/wallet-auth.ts` handles nonce generation, storage, replay protection, and SIWE message verification. `src/lib/wallet-session.ts` defines the `WalletSession` type and type guard.
- **Test coverage** — `wallet-auth.test.ts` (auth logic), `wallet-routes.test.ts` (route integration with real SIWE signing), `wallet-session.test.ts` (type guard validation).
- **`viem` direct dependency** — `^2.22.12`, matching the Zora SDK peer expectation.

### Changed
- **Wallet context stores verified sessions** — `src/lib/wallet-context.tsx` now persists `WalletSession` objects (address + connectedAt) instead of raw address strings.
- **Connect modal redesign** — single CLI flow with copy command, token paste textarea, `Cmd/Ctrl+Enter` submit, expiry refresh, and inline error states.
- **Mock trader data randomized** — addresses and volumes in `src/lib/mock-data.ts` no longer use sequential hex patterns or round numbers.
- **`llms.txt` skill URLs** — now use domain-relative paths (`/skills/<id>/skill-md`) instead of raw GitHub URLs.

## 2026-03-24 (Market-first copy system)

### Changed
- **Public site framing** — homepage, skills page, footer, leaderboard copy, metadata, and JSON-LD now position Attention Index as the place to install and inspect market skills for the Zora attention market.
- **Skill catalog wording** — visible skill descriptions, badges, and install prompts now lead with what each skill helps you do, not runtime plumbing.
- **Docs alignment** — CLAUDE.md, TONE.md, AGENTS.md, LEARNINGS.md, and README now document the market-first copy rules so future edits do not drift back to `entrypoint`, `clawhub.json`, or other implementation-first phrasing in public UI copy.

## 2026-03-24 (Custom staging auth gate)

### Added
- **App-level password gate** — `STAGING_PASSWORD` now enables a custom `/login` flow for visitor-facing pages so the Vercel hobby deployment can stay protected without Vercel's native auth.
- **Shared auth helpers** — `src/lib/staging-auth.ts` centralizes the cookie name, password-token hashing, and safe `next` path handling.
- **Auth regression coverage** — `src/__tests__/staging-auth.test.ts` covers token generation and redirect sanitization.

### Changed
- **Proxy behavior** — `src/proxy.ts` now gates visitor-facing pages, preserves the intended destination in the `next` query param, and leaves `/api`, `/api/*`, `/skills/[id]/skill-md`, `/.well-known/ai.json`, and static public files accessible.
- **Login flow** — successful login now lands with a full page navigation after the cookie is set, which avoids the client-side loop that previously left users stuck on the password screen.

## 2026-03-24 (CLI trading docs alignment)

### Changed
- **Shared identifier wording** — skill docs, catalog metadata, and agent docs now describe `zora get`, `zora buy`, and `zora sell` with `<identifier>` instead of address-only wording where the CLI now supports shared coin resolution.
- **Wallet-backed setup docs** — README, CLAUDE.md, SKILL.md files, and FAQ copy now mention `zora wallet backup` as the macOS recovery path for locally created wallets.
- **Host-readiness checks** — every `scripts/validate.sh` now checks `zora --help` in addition to `command -v zora`, and wallet-backed skills surface the Keychain backup reminder on macOS.

### Fixed
- **Stale CLI syntax references** — repo docs no longer imply that `zora buy` or `zora sell` use `--json`.

## 2026-03-23 (Stakeholder-ready install flow + skills page simplification)

### Added
- **Stakeholder deploy guidance** — README now documents the Vercel handoff, mock/live split, and an `.env.example` file for local setup.

### Changed
- **Claude Code is the default install surface** — homepage and skills page now default to a working `claude -p "..."` command instead of a non-functional OpenClaw install path.
- **Skills page detail density reduced** — fabricated install counts are gone, skill detail rows no longer show the automation/schedule/needs/category grid, and commands plus sample output now live behind a single `More info` disclosure.
- **Docs alignment** — CLAUDE.md, LEARNINGS.md, and README now describe the current runtime defaults, deploy expectations, and demo-ready mocked surfaces.

### Fixed
- **Broken repo URLs** — corrected `fraserstanley` to `fraser-stanley` in site metadata and setup docs.
- **Invalid skills JSON-LD** — removed the shell-command `installUrl` field from the skills page metadata.
- **Stakeholder copy issues** — FAQ and setup copy now match the actual `clawhub.json` filename and use more direct wording.

## 2026-03-23 (Managed skill runtime hardening)

### Added
- **Managed entrypoint integration harness** — `src/__tests__/skill-entrypoints.test.ts` now runs each `scripts/run.mjs` worker against a stubbed `zora` binary with isolated `HOME`, persisted state, and journal assertions.

### Changed
- **Managed skill release shape** — all five first-party skills now ship as real managed runtimes with `scripts/run.mjs`, `automaton.managed`, cron metadata, tunables, and richer catalog/API metadata instead of prompt-only wrappers.
- **Merge verification flow** — documented `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` as the release gate, plus the distinction between stubbed integration tests and host-level `scripts/validate.sh`.
- **Docs alignment** — README, AGENTS.md, and CLAUDE.md now reflect `@zoralabs/coins-sdk@0.5.1`, `zora balance`, and the managed entrypoint test coverage.

### Fixed
- **Direct TypeScript checks** — test typing now passes `tsc --noEmit` without relying on Next.js build-only coverage.

## 2026-03-19 (Unified install card + layout refinements)

### Added
- **Unified `RuntimeInstallCard`** — Simmer/Tempo-inspired component combining runtime tabs + code snippet + copy button in a single bordered card. Used on the skills page hero.
- **6 runtime tabs** — OpenClaw (default), Claude Code, Amp, Codex CLI, OpenCode, Cursor. Per-runtime install commands generated from `getSkillRuntimeCommands()` and `getInstallAllCommands()`.
- **SKILL.md serving route** — `GET /skills/[id]/skill-md` serves raw SKILL.md content from the domain, enabling clean URLs in CLI commands.
- **"Send your agent to Zora" hero** — skills page headline with 3-step install guide (paste, read, try).
- **Install all CTA** — single command to install every skill, shown in the unified card.

### Changed
- **Activity ticker moved to root layout** — now appears on all pages directly under the nav. Top and bottom borders removed for a cleaner look.
- **WorksWithMarquee repositioned** — moved from between hero and skills to between skills cards and live data table on the homepage.
- **Skills page restructured** — `SkillsInstallList` accepts children, hero + tabs + install-all live inside the component, 3-step grid injected as children.
- **Per-skill install commands** — each skill row shows a `CopyableCodeBlock` for the selected runtime plus a curl fallback link.
- **Install commands are agent instructions** — `claude -p "Read <url> and <action>"` pattern instead of nonexistent CLI install subcommands.

### Fixed
- **TabsList gap** — base `TabsList` component applies `gap-1` which created a visible gap on the left of the first tab in `RuntimeInstallCard`. Fixed by overriding with `gap-0` in the card's className.

## 2026-03-19 (CLI syntax update)

### Changed
- **CLI flag update** — `explore`, `get`, and `balance` use `--json`. `buy` and `sell` use `-o json`.
- **Momentum Trader buy/sell syntax** — `zora buy <identifier> --eth <amount> -o json`, `zora sell <identifier> --amount <tokens> -o json`.
- **Creator Pulse** — added `zora get <identifier> --json` to wraps once the command landed in the CLI.
- **Portfolio Scout** — `zora balance --json` for local wallet coin holdings + SDK `getProfileBalances()` for any-wallet lookups. Removed incorrect "ETH balance" references — `zora balance` returns coin holdings only, not native tokens. Updated SKILL.md with CLI + SDK dual-path documentation.
- **CLAUDE.md** — replaced "CLI command reality check" with full CLI command reference table (8 commands), JSON output schemas, behavioral notes (exit codes, `--yes` scope, sort/type combos), and corrected `zora balance` documentation.

## 2026-03-18 (Highlighter animation + homepage refinements)

### Added
- **Animated highlighter stroke** — hero heading text sweeps left-to-right like a real highlighter pen using motion/react `backgroundSize` animation with `ease-out-quint` easing, subtle `scaleY` press, and `-1.5deg` skew for a hand-drawn feel.
- **`HighlighterStroke` component** (`src/components/highlighter-stroke.tsx`) — reusable animated highlight, used on homepage and trust page hero headings.
- **`CopyableCodeBlock` component** (`src/components/copyable-code-block.tsx`) — shared terminal-style copy block used in hero and skills pages.
- **Homepage get-started steps** and **works-with section** — new homepage content sections.
- **PnL highlight badges** — gain/loss values in coin table and portfolio now use filled background badges instead of colored text.

### Changed
- `.highlight-block` padding tightened from `0.1em 0.3em` to `0.02em 0.15em` to hug letterforms.
- Added `prefers-reduced-motion` CSS exemption for `.highlight-block` so motion/react controls the animation behavior (same pattern as the ticker fix).

## 2026-03-18 (Homepage terminal board)

### Added
- **Homepage terminal market board** — replaced the old 4-card "Agent activity" module with a single tabbed board for Trending, Gainers, Volume, and Traders.
- **CRT-style loading sweep** — the board skeleton now uses a subtle top-to-bottom scan treatment instead of static card placeholders.

### Changed
- Homepage market queries now preload 8 rows per tab so the board has real table density from first paint.
- Board refreshes and preview shuffles now use full-strength market color on the entire row: `#3FFF00`, `#FF00F0`, or nothing.
- README and CLAUDE.md now describe the homepage board as a terminal-style market pane instead of live cards.

## 2026-03-17 (CLI audit + UI fixes)

### Added
- **Wallet connect modal** — mock wallet flow (MetaMask, Coinbase Wallet, WalletConnect) with localStorage persistence and truncated address display.
- **Activity ticker in layout** — marquee now appears on all pages (moved from homepage-only), white background, normal document flow.
- Wallet context (`src/lib/wallet-context.tsx`) with `useSyncExternalStore` for SSR-safe state.

### Changed
- **CLI audit alignment** — removed nonexistent CLI commands from skill `wraps` arrays (`zora get`, `zora profile`). Portfolio Scout now wraps SDK calls. Momentum Trader `buy`/`sell` kept as planned commands.
- Install tab renamed from "Zora CLI" to "Tell your agent" — install commands are agent instructions, not shell commands.
- "Manual" tab renamed to "curl".
- "CLI commands wrapped" heading changed to "Commands wrapped".
- Trust page updated with accurate wallet details: storage path, `--create` flag, `ZORA_PRIVATE_KEY` env var, no spending limits disclaimer.
- Card titles use default font instead of condensed (`font-display` removed from `CardTitle`).
- Nav buttons (Login/Index) no longer show icons.
- Tab active state uses black fill + white text.

### Fixed
- Login button now opens wallet connect modal (was a dead button with no handler).
- Wallet connect modal now reliably paints above its backdrop. Root cause was CSS painting order: the backdrop was `absolute`, while the panel wrapper was non-positioned, so the backdrop painted above it despite coming earlier in the DOM. Adding `relative` to the panel container fixed it.
- Lint errors: ref access during render in nav, setState in effects in wallet modal.
- Nav logo scaled to 17px. Portfolio loadout buttons standardized. Tab unselected state gets gray fill.

## 2026-03-17

### Added
- **Momentum Trader** skill — first execution-capable skill. Auto-buys trending Zora coins on momentum signals via the Zora CLI. Requires a dedicated trader wallet created with `zora setup`.
- Amber "Execution" badge styling to visually distinguish execution skills from read-only ones on homepage and skills page.
- Reusable docs-style UI primitives: `Callout`, `Steps`, `useHasHover`, and session-backed disclosure state for install/details interactions.

### Changed
- Skill install commands updated from `claude skill add` / OpenClaw patterns to `npx zora-cli install` (CLI tab), `npx skills add zora-cli` (OpenClaw tab).
- "Claude Code" install tab renamed to "Zora CLI" across the skills page.
- Skills JSON-LD `installUrl` now references the CLI install command.
- CLAUDE.md updated: 5 skills, execution boundary notes, Zora CLI wallet references.
- Button hover states now use explicit Tailwind variant classes instead of the global `.btn-base` CSS variable hover system, with scoped color transitions and press feedback.
- Skills page install UX now uses a persisted method picker, floating copy affordances, richer source links, and doc-style install guidance that distinguishes read-only versus execution-capable skills.
- Command menu now stores recent selections in session storage and shows breadcrumb-style metadata in results.
- Trust & Safety copy now reflects the mixed-scope skill catalog more accurately, including execution-capable published skills.

### Fixed (RAMS audit)
- Install button accessibility: added `aria-label`, `onFocus`/`onBlur` handlers, and `focus-visible` styles so keyboard users can discover and trigger the "Remove" action.
- Amber "Execution" badge contrast: changed from `text-amber-500` (~2.1:1) to `text-amber-300` on `bg-amber-500/20` for WCAG 4.5:1 compliance.
- Homepage skills grid: capped to 4 cards (`skills.slice(0, 4)`) to prevent orphan 5th card on 4-column layout.
- Trust page "What we don't do" list: added `aria-hidden` on color-only "x" markers + `sr-only` text for screen readers (WCAG 1.4.1).
- Skill detail and sample-output disclosures now persist during the session instead of collapsing on navigation.

### Fixed (Portfolio UI)
- Nav logo scaled 1.2× larger (`h-3.5` → `h-[17px]`) for better readability.
- Agent loadout buttons standardized to `w-[120px]` with tighter icon–text gap so Install, Installed, and Remove are visually consistent.
- Remove hover changed from red outline to pink fill (`#FF00F0`) + black text, matching the Installed green-fill treatment.
- Unselected tabs now carry a persistent `bg-foreground/5` fill (matching their hover gray) so they always look clickable.
