# Learnings

Decisions, trade-offs, and context that aren't obvious from the code.

## 2026-03-17 — Zora CLI integration + Momentum Trader

### Install commands are CLI-first now
We moved from per-skill install commands (`claude skill add <github-url>`) to a single `npx zora-cli install` for all skills. The CLI is the execution layer — skills are capabilities within it, not standalone packages. OpenClaw tab uses `npx skills add zora-cli`. Manual tab keeps `curl -O` for the raw SKILL.md.

### Momentum Trader is the first execution skill
All prior skills were `risk: "none"` / read-only. Momentum Trader is `risk: "medium"` and wraps `zora buy` / `zora sell`. The trust page's "Trader" wallet preset already covers the safety model (bounded funds, dedicated wallet). The skill references `zora setup` for wallet creation — the CLI creates its own EOA, not a Bankr or Privy wallet.

### Badge styling for execution skills
"Execution" badge uses `bg-amber-500/20 text-amber-300 border-amber-500/30` to stand out from read-only `outline` badges. Initial version used `text-amber-500` which failed WCAG contrast (~2.1:1) — `text-amber-300` passes at 4.5:1 on dark backgrounds. This is a simple string match (`badge === "Execution"`) in both `skill-card-client.tsx` and `page.tsx`. If we add more execution skills, the same pattern applies automatically.

### Hover-only state changes need keyboard parity
The install button's "Installed" → "Remove" label swap originally only triggered on `onMouseEnter`/`onMouseLeave`. Keyboard and screen reader users couldn't discover the remove action. Fixed by adding `onFocus`/`onBlur` + `focus-visible` CSS + a permanent `aria-label`. Any future hover-dependent UI changes should always mirror with focus handlers.

### Bankr vs Zora CLI wallet
Initially designed Momentum Trader around Bankr's swap primitives. Updated to reference the Zora CLI's native wallet and buy/sell commands since the CLI creates its own EOA during setup. Bankr remains relevant as an alternative execution backend but isn't the primary path.

### SkillInstallCommands key rename
Renamed `claude` → `cli` in the `SkillInstallCommands` interface and all consumers (`skill-card-client.tsx` Method type, skills page JSON-LD). This touched the API response shape at `/api/skills` — any external agents consuming the old `install.claude` key will need to update to `install.cli`.
