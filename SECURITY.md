# Security

## Reporting vulnerabilities

If you find a security issue, please report it through [GitHub Security Advisories](https://github.com/fraser-stanley/attention-zip/security/advisories/new) rather than opening a public issue.

We will acknowledge reports within 48 hours and provide a timeline for resolution.

## What counts as a security issue

- Credential or API key exposure in source code or logs
- Authentication bypass in the staging gate or agent registration flow
- Rate limit bypass on mutation endpoints
- Server-side code execution or injection vulnerabilities

## Architecture context

Trading skills (Copy Trader, Momentum Trader) run locally through the user's agent runtime and Zora CLI. The site does not execute trades, hold keys, or custody funds server-side. Skill guardrails live in the local skill runtime, not on the server.

The wallet connect flow is address-only. The site does not ask browsers to sign messages. Portfolio data is public on-chain data.
