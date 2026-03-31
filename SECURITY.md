# Security

## Reporting vulnerabilities

Found a security issue? Report it through [GitHub Security Advisories](https://github.com/fraser-stanley/attention-zip/security/advisories/new), not a public issue.

We'll acknowledge reports within 48 hours and give you a timeline for resolution.

## What counts as a security issue

- Credential or API key exposure in source code or logs
- Server-side code execution or injection
- XSS via user-controlled data in API responses
- Supply chain compromise of dependencies or CI actions

## Architecture context

Trading skills (Copy Trader, Momentum Trader) run locally through the user's agent runtime and Zora CLI. The site doesn't execute trades, hold keys, or custody funds server-side. Guardrails live in the local skill runtime, not on the server.

Wallet connect is address-only -- the site never asks browsers to sign messages. Portfolio data is public on-chain data.
