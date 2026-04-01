# Contributing

Skills are the product. The site serves them.

## Add a skill

The fastest way: copy `skills/trend-scout/`, rename it, edit the `SKILL.md`. Every skill is a remixable template — fork one that's close to what you want and make it yours.

```bash
cp -r skills/trend-scout skills/your-skill
# edit skills/your-skill/SKILL.md
```

For complex or trading skills, consider opening an issue first to discuss the design.

## Skill structure

Each skill lives under `skills/`:

```
skills/<skill-slug>/
  SKILL.md            # Required — agent instructions (AgentSkills/OpenClaw format)
  clawhub.json        # Optional — runtime config and tunables
  scripts/run.mjs     # Optional — managed entrypoint for scheduled skills
  scripts/validate.sh # Optional — dependency check script
```

Only `SKILL.md` is required. The other files are for managed/automated skills that run on a schedule. See any existing skill for reference.

## Before submitting

Run the merge gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four must pass.

## Rules

- Skills must use the [Zora CLI](https://cli.zora.com/) and be relevant to Zora attention markets
- Trading skills must default to dry-run mode
- No paid features or token mechanics
- One concern per PR
