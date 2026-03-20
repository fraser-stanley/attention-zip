# Learnings

Decisions, trade-offs, and context that aren't obvious from the code.

## 2026-03-19 — Unified install card + runtime tabs

### TabsList base class override
The shadcn/ui `TabsList` component applies `gap-1 bg-muted p-1` in its base className. When overriding with `bg-transparent p-0`, the `gap-1` still applies unless explicitly zeroed with `gap-0`. This created a visible gap on the left side of the first tab in the `RuntimeInstallCard`. Always override all three properties (`gap-0 bg-transparent p-0`) when restyling `TabsList` as a flush container.

### Install commands are agent prompts, not shell commands
The Zora CLI has no `install` or `skills` subcommand. What we call "install" is actually a prompt instruction: `claude -p "Read <url> and <action>"`. The SKILL.md is served from the domain at `/skills/[id]/skill-md` so URLs work in all environments. OpenClaw is the exception — it has a real `clawhub install <skill-id>` command.

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
