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

const AGENT_REGISTRATION_PATH = "/api/agents/register";

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
    syntax: "zora wallet info | zora wallet export | zora wallet backup",
    notes: "Wallet inspection, export, and Keychain backup on macOS.",
  },
  {
    command: "zora auth",
    syntax: "zora auth configure | zora auth status",
    notes: "API key management.",
  },
] as const;

function formatRuntimeCommands(
  commands: RuntimeCommands | SkillRuntimeCommands,
): string {
  const lines = [
    `- OpenClaw: ${commands.openclaw}`,
    `- Claude Code: ${commands.claude}`,
    `- Amp: ${commands.amp}`,
    `- Codex CLI: ${commands.codex}`,
    `- OpenCode: ${commands.opencode}`,
    `- Cursor: ${commands.cursor}`,
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

      return `- ${skill.name}: ${skill.description} | SKILL.md: ${skillUrl} | Claude Code: ${quickInstall.claude}`;
    })
    .join("\n");
}

function buildSkillReference(skill: Skill, siteUrl: string): string {
  const skillUrl = toAbsoluteUrl(`/skills/${skill.id}/skill-md`, siteUrl);
  const install = getSkillRuntimeCommands(skill, siteUrl);

  return [
    `## ${skill.name}`,
    skill.longDescription,
    `Skill URL: ${skillUrl}`,
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
    description: "Verified skills for Zora-native agents",
    api: "/api",
    skills_endpoint: "/api/skills",
    explore_endpoint: "/api/explore",
    leaderboard_endpoint: "/api/leaderboard",
    portfolio_endpoint: "/api/portfolio",
    llms_txt: "/llms.txt",
    llms_full_txt: "/llms-full.txt",
    agent_registration_url: AGENT_REGISTRATION_PATH,
    documentation: getDocumentationUrl(siteUrl),
    source_repository: getSiteRepoUrl(),
  };
}

export function buildLlmsTxt(siteUrl: string) {
  const installAllCommands = getInstallAllCommands(siteUrl);

  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

Catalog: ${toAbsoluteUrl("/api/skills", siteUrl)}
Default install (Claude Code): ${installAllCommands.claude}

## Skills

${buildSkillSummaryLines(siteUrl)}
`;
}

export function buildLlmsFullTxt(siteUrl: string) {
  const installAllCommands = getInstallAllCommands(siteUrl);

  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

## Catalog

- Skill catalog API: ${toAbsoluteUrl("/api/skills", siteUrl)}
- API discovery: ${toAbsoluteUrl("/api", siteUrl)}
- Agent discovery: ${toAbsoluteUrl("/.well-known/ai.json", siteUrl)}
- Source repository: ${getSiteRepoUrl()}

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

## Agent Registration

Coming soon: agent registration and human wallet claiming will publish at ${toAbsoluteUrl(
    AGENT_REGISTRATION_PATH,
    siteUrl,
  )}.
Watch ${toAbsoluteUrl("/api", siteUrl)} and ${toAbsoluteUrl(
    "/.well-known/ai.json",
    siteUrl,
  )} for the published contract.
`;
}
