# Contributing

The skills are the product. The site serves them. Contributions that improve skills or make them easier to use are welcome.

## What we accept

- New skills or improvements to existing ones
- Bug fixes
- Documentation improvements
- Fixes to skill-serving infrastructure (API routes, discovery docs, install commands)

## What needs discussion first

Open an issue before starting work on:

- A new skill
- Changes to the skill format (SKILL.md structure, clawhub.json schema)
- Significant site changes beyond bug fixes

The site design and UI are not the contribution surface. We accept bug fixes and skill-serving improvements, but not unsolicited redesigns.

## Skill structure

Each skill lives in its own directory at the project root:

```
<skill-slug>/
  SKILL.md          # Agent instructions (AgentSkills/OpenClaw format)
  clawhub.json      # Runtime config
  scripts/run.mjs   # Managed entrypoint
  scripts/validate.sh
```

See [AGENTS.md](AGENTS.md) for the full skill format reference and how to add a new skill.

## Before submitting

Run the merge gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four must pass. `pnpm test` validates SKILL.md structure, cross-file sync, and managed entrypoint behavior.

## Pull requests

- One concern per PR
- Include which skills are affected (if any)
- Confirm the merge gate passes

## Scope limits

- No third-party skill submissions without prior discussion
- No paid features or token mechanics
- Trading skills must default to dry-run mode
