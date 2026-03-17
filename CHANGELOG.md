# Changelog

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
- Agent loadout buttons standardized to `w-[120px]` with tighter icon–text gap so Equip, Equipped, and Remove are visually consistent.
- Remove hover changed from red outline to pink fill (`#FF00F0`) + black text, matching the Equipped green-fill treatment.
- Unselected tabs now carry a persistent `bg-foreground/5` fill (matching their hover gray) so they always look clickable.
