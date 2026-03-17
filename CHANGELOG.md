# Changelog

## 2026-03-17

### Added
- **Momentum Trader** skill — first execution-capable skill. Auto-buys trending Zora coins on momentum signals via the Zora CLI. Requires a dedicated trader wallet created with `zora setup`.
- Amber "Execution" badge styling to visually distinguish execution skills from read-only ones on homepage and skills page.

### Changed
- Skill install commands updated from `claude skill add` / OpenClaw patterns to `npx zora-cli install` (CLI tab), `npx skills add zora-cli` (OpenClaw tab).
- "Claude Code" install tab renamed to "Zora CLI" across the skills page.
- Skills JSON-LD `installUrl` now references the CLI install command.
- CLAUDE.md updated: 5 skills, execution boundary notes, Zora CLI wallet references.
