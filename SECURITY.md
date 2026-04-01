# Security

## Reporting vulnerabilities

If you find a security issue, please report it through [GitHub Security Advisories](https://github.com/fraser-stanley/attention-zip/security/advisories/new) rather than opening a public issue.

We will acknowledge reports within 48 hours and provide a timeline for resolution.

## Architecture

The site does not execute trades or hold keys. Skills run locally through the user's agent runtime and Zora CLI. The wallet connect flow is address-only — no signing.

## What counts as a security issue

- Credential or API key exposure in source code or logs
- Authentication bypass in the staging gate or agent registration flow
- Rate limit bypass on mutation endpoints
- Server-side code execution or injection vulnerabilities

