# Claude Agent Guide

Canonical project guidance lives in [`../CLAUDE.md`](../CLAUDE.md).

This mirror exists for agent tooling that expects `agents/claude.md`. Keep it aligned with the root guide.

## Current architecture highlights

- Public agent entrypoints: `/api`, `/api/skills`, `/api/explore`, `/api/leaderboard`, and `/.well-known/ai.json`
- First paint on `/`, `/dashboard`, and `/leaderboard` is server-rendered through `src/lib/data.ts`, then React Query handles refresh in thin client wrappers
- Skills remain static in `src/lib/skills.ts`; install commands are shared between the UI and `/api/skills`
- JSON-LD is emitted from the root layout and skills page for machine-readable discovery
- `buttonVariants` should be imported from `@/components/ui/button-variants` when styling links from server components
