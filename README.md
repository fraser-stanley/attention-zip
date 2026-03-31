# Zora Agent Skills

Agent skills for the Zora attention market. Scan trends, check portfolios, build briefings, and trade momentum.

## Skills

| Skill | Description | Type |
| --- | --- | --- |
| [trend-scout](trend-scout/) | Tracks trend leaders, new entrants, and volume shifts | Read-only |
| [creator-pulse](creator-pulse/) | Tracks creator-coin leaders and watchlist moves | Read-only |
| [briefing-bot](briefing-bot/) | Turns the market into a short briefing | Read-only |
| [portfolio-scout](portfolio-scout/) | Checks balances, position changes, and concentration | Read-only |
| [copy-trader](copy-trader/) | Mirrors public Zora wallet moves with guardrails. Dry run by default | Execution |
| [momentum-trader](momentum-trader/) | Quotes and manages momentum trades. Dry run by default | Execution |

Each skill directory contains a `SKILL.md` for agent instructions, `clawhub.json` for runtime metadata, and `scripts/` for the managed entrypoint and validation.

## Quick start

```bash
git clone git@github.com:fraser-stanley/attention-zip.git
cd zora-agent-skills
pnpm install
pnpm dev
```

## Development

```bash
pnpm dev          # dev server at localhost:3000
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest
pnpm build        # production build
```

Merge gate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
