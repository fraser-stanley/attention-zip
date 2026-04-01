# Contributing

## Add a skill

Copy `skills/trend-scout/`, rename it, edit the `SKILL.md`. Submit a PR with a clear description of what your skill does.

```bash
cp -r skills/trend-scout skills/your-skill
# edit skills/your-skill/SKILL.md
```

Only `SKILL.md` is required. `clawhub.json` and `scripts/` are optional.

## Skill format

SKILL.md follows the [AgentSkills/OpenClaw](https://github.com/AgentSkills) format. See any existing skill directory for reference.

Recommended frontmatter:

```yaml
name: your-skill-slug
description: One sentence, max 1024 characters.
metadata:
  author: "Your Name"
  version: "1.0.0"
  displayName: "Your Skill Name"
  difficulty: "beginner"
```

## Rules

- Skills must use the [Zora CLI](https://cli.zora.com/) and be relevant to Zora attention markets
- Trading skills must default to dry-run mode
- No paid features or token mechanics
- One concern per PR

## Before submitting

Run the merge gate:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass.
