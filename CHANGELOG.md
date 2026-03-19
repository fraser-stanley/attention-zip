# Changelog

## 2026-03-19 (CLI syntax update)

### Changed
- **CLI flag update** — all skill `wraps` arrays now use `--json` instead of the old `-o json` syntax.
- **Momentum Trader buy/sell syntax** — `zora buy <address> --eth <amount> --json` (was `--amount <eth>`), `zora sell` now includes `--json`.
- **Creator Pulse** — added `zora get <address> --json` to wraps (command now exists in CLI).
- **Portfolio Scout** — `zora balances --json` for local wallet coin holdings + SDK `getProfileBalances()` for any-wallet lookups. Removed incorrect "ETH balance" references — `zora balances` returns coin holdings only, not native tokens. Updated SKILL.md with CLI + SDK dual-path documentation.
- **CLAUDE.md** — replaced "CLI command reality check" with full CLI command reference table (8 commands), JSON output schemas, behavioral notes (exit codes, `--yes` scope, sort/type combos), and corrected `zora balances` documentation.

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
