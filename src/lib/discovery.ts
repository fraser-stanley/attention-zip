import {
  getInstallAllCommands,
  getSkillQuickInstallCommands,
  getSkillRuntimeCommands,
  skills,
  type RuntimeCommands,
  type Skill,
  type SkillRuntimeCommands,
} from "@/lib/skills";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getDocumentationUrl,
  getSiteRepoUrl,
  toAbsoluteUrl,
} from "@/lib/site";

const CLI_REFERENCE = [
  {
    command: "zora explore",
    syntax: "zora explore --sort <sort> --type <type> --limit <n> --json",
    notes:
      "Sorts: mcap, volume, new, gainers, trending, featured, last-traded, last-traded-unique. Types: all, trend, creator-coin, post.",
  },
  {
    command: "zora get",
    syntax: "zora get <identifier> [--type <type>] --json",
    notes:
      "Identifier can be a 0x address or supported coin or creator name. It does not resolve ENS.",
  },
  {
    command: "zora buy",
    syntax: "zora buy <address> --eth <amount> --json",
    notes:
      "Requires a 0x address. Also supports --usd, --token, --percent, --all, --quote, --yes, --slippage, and --debug.",
  },
  {
    command: "zora sell",
    syntax: "zora sell <address> --amount <tokens> --json",
    notes:
      "Requires a 0x address. Also supports --usd, --token, --percent, --all, --to, --quote, --yes, --slippage, and --debug.",
  },
  {
    command: "zora balance",
    syntax: "zora balance [spendable|coins] --json",
    notes:
      "No subcommand returns wallet tokens and coin positions. `spendable` returns ETH, USDC, and ZORA only. `coins` supports --sort.",
  },
  {
    command: "zora setup",
    syntax: "zora setup [--create] [--force]",
    notes: "Creates or imports a wallet at ~/.config/zora/wallet.json.",
  },
  {
    command: "zora wallet",
    syntax: "zora wallet info | zora wallet export",
    notes: "Wallet inspection and private key export.",
  },
  {
    command: "zora auth",
    syntax: "zora auth configure | zora auth status",
    notes: "API key management.",
  },
  {
    command: "zora price-history",
    syntax: "zora price-history [identifier] [--type <type>] [--interval <interval>] --json",
    notes:
      "Displays price history for a coin. Types: creator-coin, post, trend. Intervals: 1h, 24h, 1w, 1m, ALL.",
  },
  {
    command: "zora profile",
    syntax: "zora profile [identifier] [--live|--static] [--refresh <seconds>] --json",
    notes:
      "Views profile activity with posts and holdings. Defaults to the active wallet when identifier is omitted.",
  },
  {
    command: "zora send",
    syntax: "zora send [identifier] --to <address> [--amount <value>|--percent <value>|--all] [--type <type>] [--yes] --json",
    notes:
      "Sends coins or ETH to another address. Identifier can be a coin address, name, or token symbol such as eth, usdc, or zora.",
  },
] as const;

function formatRuntimeCommands(
  commands: RuntimeCommands | SkillRuntimeCommands,
): string {
  const lines = [
    `- Any agent (paste as prompt): ${commands.prompt}`,
    `- OpenClaw: ${commands.openclaw}`,
    `- Claude Code: ${commands.claude}`,
    `- Amp: ${commands.amp}`,
    `- Codex CLI: ${commands.codex}`,
    `- OpenCode: ${commands.opencode}`,
    `- Cursor: ${commands.cursor}`,
    `- curl: ${commands.curl}`,
  ];

  if ("manual" in commands) {
    lines.push(`- Manual: ${commands.manual}`);
  }

  return lines.join("\n");
}

function formatRequirements(skill: Skill): string {
  const envLine =
    skill.requires.env.length > 0 ? skill.requires.env.join(", ") : "none";

  return [`- Binaries: ${skill.requires.bins.join(", ")}`, `- Env: ${envLine}`].join(
    "\n",
  );
}

function buildSkillSummaryLines(siteUrl: string): string {
  return skills
    .map((skill) => {
      const skillUrl = toAbsoluteUrl(`/skills/${skill.id}/skill-md`, siteUrl);
      const quickInstall = getSkillQuickInstallCommands(skill, siteUrl);

      return `- ${skill.name}: ${skill.description} | Skill notes: ${skillUrl} | Install: ${quickInstall.prompt}`;
    })
    .join("\n");
}

function buildSkillReference(skill: Skill, siteUrl: string): string {
  const skillUrl = toAbsoluteUrl(`/skills/${skill.id}/skill-md`, siteUrl);
  const install = getSkillRuntimeCommands(skill, siteUrl);

  return [
    `## ${skill.name}`,
    skill.longDescription,
    `Skill notes: ${skillUrl}`,
    `Source: ${skill.githubUrl}`,
    "",
    "Install commands",
    formatRuntimeCommands(install),
    "",
    "Requirements",
    formatRequirements(skill),
    "",
    "Commands",
    ...skill.commands.map((command) => `- ${command}`),
    "",
    `Sample prompt: ${skill.samplePrompt}`,
    "",
    "Sample output",
    "```text",
    skill.sampleOutput,
    "```",
  ].join("\n");
}

export function buildAiDiscovery(siteUrl: string) {
  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    api: "/api",
    skills_endpoint: "/api/skills",
    explore_endpoint: "/api/explore",
    leaderboard_endpoint: "/api/leaderboard",
    portfolio_endpoint: "/api/portfolio",
    profile_endpoint: "/api/profile",
    coin_swaps_endpoint: "/api/coin-swaps",
    llms_txt: "/llms.txt",
    llms_full_txt: "/llms-full.txt",
    documentation: getDocumentationUrl(siteUrl),
    source_repository: getSiteRepoUrl(),
  };
}

export function buildLlmsTxt(siteUrl: string) {
  const installAllCommands = getInstallAllCommands(siteUrl);

  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Prerequisites

Install the Zora CLI (requires Node.js 20+):
npm install -g @zoralabs/cli

## How To Use This

- Skills require the Zora CLI. Install it first if the host doesn't have it.
- Use the full install when the user wants broad coverage.
- Use a single skill when the user wants one specific thing (e.g. just trending coins).
- If wallet use is unclear, start with Trend Scout, Creator Pulse, or Briefing Bot.
- Skills use the Zora CLI for market data and balance checks. Trading skills also place orders through it.

Catalog: ${toAbsoluteUrl("/api/skills", siteUrl)}
Market APIs: ${toAbsoluteUrl("/api/profile", siteUrl)} | ${toAbsoluteUrl("/api/coin-swaps", siteUrl)}
Default install (any agent): ${installAllCommands.prompt}
Single-skill target: ${siteUrl}/skills/{skill_id}/skill-md

## Skills

${buildSkillSummaryLines(siteUrl)}
`;
}

export function buildLlmsFullTxt(siteUrl: string) {
  const installAllCommands = getInstallAllCommands(siteUrl);

  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Prerequisites

Install the Zora CLI (requires Node.js 20+):
npm install -g @zoralabs/cli

## How To Explain This

- attention.zip installs the Zora CLI and agent skills for the Zora attention market.
- Lead with what the skills do: trending coins, briefings, portfolio checks, momentum trading.
- Point to source and skill notes when the user asks what gets installed.
- Skills use the Zora CLI for market data and balance checks. Trading skills also place orders through it.

## Install Guidance

- Use the full install when the user wants broad coverage.
- Use a single skill when the user wants one specific thing.
- If wallet use is unclear, start with Trend Scout, Creator Pulse, or Briefing Bot.
- Portfolio Scout, Copy Trader, and Momentum Trader need a wallet.

## Catalog

- Skill catalog API: ${toAbsoluteUrl("/api/skills", siteUrl)}
- API discovery: ${toAbsoluteUrl("/api", siteUrl)}
- Agent discovery: ${toAbsoluteUrl("/.well-known/ai.json", siteUrl)}
- Source repository: ${getSiteRepoUrl()}
- Profile API: ${toAbsoluteUrl("/api/profile", siteUrl)}
- Coin swaps API: ${toAbsoluteUrl("/api/coin-swaps", siteUrl)}

## Install All Skills

${formatRuntimeCommands(installAllCommands)}

## Skills At A Glance

${buildSkillSummaryLines(siteUrl)}

${skills.map((skill) => buildSkillReference(skill, siteUrl)).join("\n\n")}

## Zora CLI Reference

${CLI_REFERENCE.map(
  (item) =>
    `- ${item.command}: ${item.syntax}\n  ${item.notes}`,
).join("\n")}

## Market Data APIs

- Profile lookup: GET ${toAbsoluteUrl("/api/profile", siteUrl)}
  Params: identifier=<0x-address-or-handle>
  Returns: canonical wallet, linked wallets, profile id, handle, avatar
- Coin swaps: GET ${toAbsoluteUrl("/api/coin-swaps", siteUrl)}
  Params: address=<0x-coin-address>&count=1-50&after=<cursor?>
  Returns: recent swap activity, quote notional, tx hash, and pagination data

`;
}
