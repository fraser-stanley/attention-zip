import {
  SITE_REPO_REF,
  getSiteRepoName,
  getSiteRepoUrl,
} from "@/lib/site";

export interface Skill {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: "attention" | "analytics" | "trading" | "utility";
  difficulty: "beginner" | "intermediate" | "advanced";
  risk: "none" | "low" | "medium";
  riskLabel: string;
  tags: string[];
  monitors: string[];
  commands: string[];
  requires: {
    bins: string[];
    env: string[];
  };
  automation: {
    managed: boolean;
    cron: string | null;
    autostart: boolean;
    entrypoint: string | null;
    dryRunByDefault: boolean;
  };
  actionPrompt: string;
  samplePrompt: string;
  sampleOutput: string;
  badges: string[];
  githubUrl: string;
  skillMdUrl: string;
}

export type Runtime =
  | "prompt"
  | "openclaw"
  | "claude"
  | "amp"
  | "codex"
  | "opencode"
  | "cursor";

export interface RuntimeCommands {
  prompt: string;
  openclaw: string;
  claude: string;
  amp: string;
  codex: string;
  opencode: string;
  cursor: string;
  curl: string;
}

export interface SkillRuntimeCommands extends RuntimeCommands {
  manual: string;
}

type PromptRuntimeCommands = Omit<RuntimeCommands, "prompt" | "openclaw" | "curl">;

const REPO_URL = getSiteRepoUrl();
const REPO_NAME = getSiteRepoName();

function buildSkillGithubUrl(skillId: string) {
  return `${REPO_URL}/tree/${SITE_REPO_REF}/${skillId}`;
}

function buildSkillMdUrl(skillId: string) {
  return `/skills/${skillId}/skill-md`;
}

export const skills: Skill[] = [
  {
    id: "trend-scout",
    name: "Trend Scout",
    description:
      "Scans trending coins, new launches, and volume leaders.",
    longDescription:
      "Runs four market scans every 30 minutes and tells you what changed since the last run.",
    category: "attention",
    difficulty: "beginner",
    risk: "none",
    riskLabel: "Read-only, no wallet",
    tags: ["trends", "alerts", "volume", "watchlists"],
    monitors: [
      "Trending trend coins",
      "New trend launches",
      "Volume leaders",
      "Market cap leaders",
      "Watchlist hits",
    ],
    commands: [
      "zora explore --sort trending --type trend --limit 8 --json",
      "zora explore --sort new --type trend --limit 8 --json",
      "zora explore --sort volume --type trend --limit 8 --json",
      "zora explore --sort mcap --type trend --limit 8 --json",
      "zora get <identifier> --type trend --json",
    ],
    requires: {
      bins: ["zora", "node"],
      env: [],
    },
    automation: {
      managed: true,
      cron: "*/30 * * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: false,
    },
    actionPrompt:
      "Install Trend Scout and show what it reports on a schedule.",
    samplePrompt:
      "What's trending on Zora right now?",
    sampleOutput: `Trend Scout
Run at 2026-03-23T13:30:00Z

Trending leaders:
1. looksmaxxing, $2.3M mcap, +12.3%, $450.2K volume
2. hyperpop, $950.2K mcap, +22.8%, $210.4K volume

New entrants since the last run:
- hyperpop entered the trending top 8
- based penguin entered the volume top 8

Watchlist:
- 0x1234...5678 is live in the trending table

Saved snapshot to ~/.config/zora-agent-skills/trend-scout/state.json`,
    badges: ["Trend scan", "Read-only", "No wallet"],
    githubUrl: buildSkillGithubUrl("trend-scout"),
    skillMdUrl: buildSkillMdUrl("trend-scout"),
  },
  {
    id: "creator-pulse",
    name: "Creator Pulse",
    description:
      "Watches featured creators and creator-coin momentum.",
    longDescription:
      "Tracks featured, trending, and top-volume creator coins. Alerts when your watchlist moves.",
    category: "analytics",
    difficulty: "intermediate",
    risk: "none",
    riskLabel: "Read-only, no wallet",
    tags: ["creators", "watchlists", "featured", "volume"],
    monitors: [
      "Featured creators",
      "Trending creator coins",
      "Top creator-coin volume",
      "Watchlist market cap changes",
      "Watchlist holder changes",
    ],
    commands: [
      "zora explore --sort featured --type creator-coin --limit 8 --json",
      "zora explore --sort trending --type creator-coin --limit 8 --json",
      "zora explore --sort volume --type creator-coin --limit 8 --json",
      "zora get <identifier> --type creator-coin --json",
    ],
    requires: {
      bins: ["zora", "node"],
      env: [],
    },
    automation: {
      managed: true,
      cron: "*/30 * * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: false,
    },
    actionPrompt:
      "Install Creator Pulse and show watchlist alerts.",
    samplePrompt:
      "Which creators are moving today?",
    sampleOutput: `Creator Pulse
Run at 2026-03-23T13:30:00Z

Featured creators:
1. jacob, $8.1M mcap, $1.2M volume, 2,341 holders
2. alysaliu, $4.2M mcap, $890.3K volume, 1,890 holders

Watchlist alerts:
- jacob volume rose 14.8% since the last run
- alysaliu gained 67 holders since the last run

Saved snapshot to ~/.config/zora-agent-skills/creator-pulse/state.json`,
    badges: ["Creator coins", "Read-only", "No wallet"],
    githubUrl: buildSkillGithubUrl("creator-pulse"),
    skillMdUrl: buildSkillMdUrl("creator-pulse"),
  },
  {
    id: "briefing-bot",
    name: "Briefing Bot",
    description: "Turns the market into a short briefing.",
    longDescription:
      "Rolls trending, volume, new launches, gainers, and portfolio overlap into one report.",
    category: "utility",
    difficulty: "intermediate",
    risk: "none",
    riskLabel: "Read-only, wallet optional",
    tags: ["briefing", "summaries", "alerts", "digest"],
    monitors: [
      "Trending coins",
      "Top volume",
      "New launches",
      "Top gainers",
      "Portfolio overlap",
    ],
    commands: [
      "zora explore --sort trending --limit 5 --json",
      "zora explore --sort volume --limit 5 --json",
      "zora explore --sort new --limit 5 --json",
      "zora explore --sort gainers --limit 5 --json",
      "zora balance --json",
    ],
    requires: {
      bins: ["zora", "node"],
      env: [],
    },
    automation: {
      managed: true,
      cron: "0 9,21 * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: false,
    },
    actionPrompt:
      "Install Briefing Bot and show a sample briefing.",
    samplePrompt:
      "Give me a morning market briefing.",
    sampleOutput: `Zora Briefing
Run at 2026-03-23T09:00:00Z

Trending: looksmaxxing leads at $2.3M mcap, up 12.3%.
Volume: frog market leads at $3.1M volume.
New: 3 launches since the last run, largest is $45K mcap.
Gainers: hyperpop leads at +22.8%.

Portfolio overlap:
- looksmaxxing is both held and trending
- jacob is both held and a creator leader

Assessment: Active tape. Trend flow is stronger than creator flow today.`,
    badges: ["Briefing", "Read-only", "Wallet optional"],
    githubUrl: buildSkillGithubUrl("briefing-bot"),
    skillMdUrl: buildSkillMdUrl("briefing-bot"),
  },
  {
    id: "portfolio-scout",
    name: "Portfolio Scout",
    description:
      "Snapshots wallet positions and flags concentration risk.",
    longDescription:
      "Reads wallet balances and coin positions. Flags new entries, exits, and concentration risk.",
    category: "analytics",
    difficulty: "intermediate",
    risk: "none",
    riskLabel: "Read-only, wallet needed",
    tags: ["portfolio", "risk", "positions", "wallet"],
    monitors: [
      "Spendable wallet balances",
      "Coin positions by value",
      "New and closed positions",
      "Portfolio concentration",
      "Run-to-run drawdowns",
    ],
    commands: [
      "zora balance --json",
      "zora balance spendable --json",
      "zora balance coins --sort usd-value --limit 20 --json",
      "zora balance coins --sort price-change --limit 20 --json",
    ],
    requires: {
      bins: ["zora", "node"],
      env: ["ZORA_PRIVATE_KEY"],
    },
    automation: {
      managed: true,
      cron: "0 */4 * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: false,
    },
    actionPrompt:
      "Install Portfolio Scout and show a portfolio report.",
    samplePrompt:
      "How does my wallet look?",
    sampleOutput: `Portfolio Scout
Run at 2026-03-23T12:00:00Z

Spendable:
- 0.42 ETH
- 183.20 USDC
- 95.11 ZORA

Coin positions:
1. jacob, $4,120.00, 68.1% of tracked coin value
2. looksmaxxing, $1,150.00, 19.0% of tracked coin value

Alerts:
- Concentration warning: jacob is above the 35% threshold
- based penguin is no longer held

Tracked coin value: $6,050.00`,
    badges: ["Portfolio", "Read-only", "Wallet needed"],
    githubUrl: buildSkillGithubUrl("portfolio-scout"),
    skillMdUrl: buildSkillMdUrl("portfolio-scout"),
  },
  {
    id: "copy-trader",
    name: "Copy Trader",
    description:
      "Follows public wallets and mirrors their trades. Dry run by default.",
    longDescription:
      "Picks up buys, trims, and exits from source wallets. Confirms each swap before copying.",
    category: "trading",
    difficulty: "advanced",
    risk: "medium",
    riskLabel: "Trading skill, dedicated wallet needed",
    tags: [
      "copytrade",
      "leaderboard",
      "wallet-following",
      "execution",
      "risk-controls",
    ],
    monitors: [
      "Source wallet moves",
      "Stale copy skips",
      "Price-drift checks",
      "Position concentration",
      "Duplicate suppression",
      "State reconciliation",
    ],
    commands: [
      "node scripts/run.mjs",
      "zora buy <address> --usd <amount> --token <asset> --quote --json",
      "zora buy <address> --usd <amount> --token <asset> --slippage <pct> --json --yes",
      "zora sell <address> --percent <pct> --to <asset> --quote --json",
      "zora sell <address> --percent <pct> --to <asset> --slippage <pct> --json --yes",
      "zora balance --json",
      "zora balance coins --sort usd-value --limit 20 --json",
    ],
    requires: {
      bins: ["zora", "node"],
      env: ["ZORA_PRIVATE_KEY"],
    },
    automation: {
      managed: true,
      cron: "* * * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: true,
    },
    actionPrompt:
      "Install Copy Trader and show a dry-run cycle.",
    samplePrompt:
      "Show me what jacob's wallet has been doing and dry-run a copy.",
    sampleOutput: `Copy Trader
Run at 2026-03-27T13:40:00Z
Mode: dry-run
Health: healthy

Sources tracked: 2
- jacob, manual
- reef-X4B2, leaderboard

Confirmed source actions:
- BUY hyperpop from jacob, source age 54s, source $84.00, planned copy $25.00
  Quote: $25.00 -> 263 HYPERPOP, age 54s, drift +3.8%
  Action: dry-run only, no order sent
- SELL moonbag from reef-X4B2 skipped, stale exit, live mode skipped`,
    badges: ["Copytrade", "Dry run default", "Execution"],
    githubUrl: buildSkillGithubUrl("copy-trader"),
    skillMdUrl: buildSkillMdUrl("copy-trader"),
  },
  {
    id: "momentum-trader",
    name: "Momentum Trader",
    description:
      "Scans gainers, scores entries, manages exits. Dry run by default.",
    longDescription:
      "Finds momentum candidates, quotes entries, and manages stop-loss, take-profit, and trailing-stop exits.",
    category: "trading",
    difficulty: "advanced",
    risk: "medium",
    riskLabel: "Trading skill, dedicated wallet needed",
    tags: ["trading", "momentum", "edge-scoring", "trailing-stops"],
    monitors: [
      "Edge-scored candidates",
      "Stop-loss exits",
      "Take-profit exits",
      "Trailing stop exits",
      "Flip-flop guard",
    ],
    commands: [
      "zora explore --sort gainers --limit 12 --json",
      "zora explore --sort trending --limit 12 --json",
      "zora get <identifier> --json",
      "zora balance coins --sort usd-value --limit 20 --json",
      "zora buy <identifier> --eth <amount> --quote --json",
      "zora buy <identifier> --eth <amount> --slippage <pct> --json --yes",
      "zora sell <identifier> --percent 100 --to eth --slippage <pct> --json --yes",
    ],
    requires: {
      bins: ["zora", "node"],
      env: ["ZORA_PRIVATE_KEY"],
    },
    automation: {
      managed: true,
      cron: "*/10 * * * *",
      autostart: false,
      entrypoint: "scripts/run.mjs",
      dryRunByDefault: true,
    },
    actionPrompt:
      "Install Momentum Trader and show a dry-run cycle.",
    samplePrompt:
      "Scan for momentum and show me what you'd buy.",
    sampleOutput: `Momentum Trader
Run at 2026-03-23T13:40:00Z
Mode: dry-run

Open positions tracked: 1
- looksmaxxing, entry $0.000210, peak $0.000240, current $0.000170
  Stop-loss fired: price $0.000170 is 19.0% below entry $0.000210

Candidates (3 evaluated, 1 filtered by slippage):
- Skipped FROGCOIN: exited recently (flip-flop guard)
1. hyperpop, +28.3%, $210K volume, slippage 1.2%
   Quote: 0.01 ETH -> 263 HYPERPOP
   Action: dry-run only, no order sent

State saved to ~/.config/zora-agent-skills/momentum-trader/state.json`,
    badges: ["Momentum", "Dry run default", "Execution"],
    githubUrl: buildSkillGithubUrl("momentum-trader"),
    skillMdUrl: buildSkillMdUrl("momentum-trader"),
  },
];

export function getSkillById(id: string) {
  return skills.find((skill) => skill.id === id) ?? null;
}

function buildRuntimeCommands(prompt: string): PromptRuntimeCommands {
  return {
    claude: `claude -p "${prompt}"`,
    amp: `amp "${prompt}"`,
    codex: `codex "${prompt}"`,
    opencode: `opencode run "${prompt}"`,
    cursor: `cursor "${prompt}"`,
  };
}

function buildInstallAllPrompt(baseUrl: string) {
  return `Install skills from ${baseUrl}/llms.txt`;
}

function buildSkillInstallPrompt(skill: Skill, baseUrl: string) {
  return `Install ${skill.name} from ${baseUrl}/skills/${skill.id}/skill-md`;
}

export function getInstallAllQuickCommands(baseUrl: string): RuntimeCommands {
  const prompt = buildInstallAllPrompt(baseUrl);
  return {
    prompt: `Install the Zora CLI and skills from ${baseUrl}/llms.txt`,
    openclaw: skills.map((skill) => `clawhub install ${skill.id}`).join(" && "),
    ...buildRuntimeCommands(prompt),
    curl: `curl -sL ${baseUrl}/llms-full.txt`,
  };
}

export function getInstallAllCommands(baseUrl: string): SkillRuntimeCommands {
  return {
    ...getInstallAllQuickCommands(baseUrl),
    manual: `git clone --depth 1 ${REPO_URL}`,
  };
}

export function getSkillQuickInstallCommands(
  skill: Skill,
  baseUrl: string,
): RuntimeCommands {
  return {
    prompt: `Read the skill doc at ${baseUrl}/skills/${skill.id}/skill-md and follow the install instructions.`,
    openclaw: `clawhub install ${skill.id}`,
    ...buildRuntimeCommands(buildSkillInstallPrompt(skill, baseUrl)),
    curl: `curl -sL ${baseUrl}/skills/${skill.id}/skill-md`,
  };
}

export function getSkillRuntimeCommands(
  skill: Skill,
  baseUrl: string,
): SkillRuntimeCommands {
  return {
    ...getSkillQuickInstallCommands(skill, baseUrl),
    manual: `git clone --depth 1 ${REPO_URL} && cd ${REPO_NAME}/${skill.id}`,
  };
}
