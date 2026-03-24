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
  | "openclaw"
  | "claude"
  | "amp"
  | "codex"
  | "opencode"
  | "cursor";

export interface SkillRuntimeCommands {
  openclaw: string;
  claude: string;
  amp: string;
  codex: string;
  opencode: string;
  cursor: string;
  manual: string;
}

const REPO_URL = "https://github.com/fraser-stanley/zora-agent-skills";

export const skills: Skill[] = [
  {
    id: "trend-scout",
    name: "Trend Scout",
    description:
      "Scans trend coins, ranks the leaders, and alerts on new entrants.",
    longDescription:
      "Scans trending, new, volume, and market cap views on a schedule and flags what changed.",
    category: "attention",
    difficulty: "beginner",
    risk: "none",
    riskLabel: "Read-only, no wallet needed",
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
      "install or mirror the Trend Scout skill and explain how to run its scheduled trend scan",
    samplePrompt:
      "Install Trend Scout and tell me what it reports every 30 minutes.",
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
    badges: ["Managed skill", "CLI native", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/trend-scout",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/trend-scout/SKILL.md",
  },
  {
    id: "creator-pulse",
    name: "Creator Pulse",
    description:
      "Tracks featured creators, creator-coin momentum, and watchlist changes.",
    longDescription:
      "Tracks creator coins across featured, trending, and volume lists and alerts on watchlist changes.",
    category: "analytics",
    difficulty: "intermediate",
    risk: "none",
    riskLabel: "Read-only, no wallet needed",
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
      "install or mirror the Creator Pulse skill and explain its creator watchlist alerts",
    samplePrompt:
      "Install Creator Pulse and summarize what it would alert me on.",
    sampleOutput: `Creator Pulse
Run at 2026-03-23T13:30:00Z

Featured creators:
1. jacob, $8.1M mcap, $1.2M volume, 2,341 holders
2. alysaliu, $4.2M mcap, $890.3K volume, 1,890 holders

Watchlist alerts:
- jacob volume rose 14.8% since the last run
- alysaliu gained 67 holders since the last run

Saved snapshot to ~/.config/zora-agent-skills/creator-pulse/state.json`,
    badges: ["Managed skill", "Watchlists", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/creator-pulse",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/creator-pulse/SKILL.md",
  },
  {
    id: "briefing-bot",
    name: "Briefing Bot",
    description: "Builds a scheduled Zora market briefing from live CLI scans.",
    longDescription:
      "Merges five market scans into one briefing and diffs it against the previous run.",
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
      "install or mirror the Briefing Bot skill and explain its daily briefing schedule",
    samplePrompt:
      "Install Briefing Bot and show me the kind of briefing it emits.",
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
    badges: ["Managed skill", "Briefings", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/briefing-bot",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/briefing-bot/SKILL.md",
  },
  {
    id: "portfolio-scout",
    name: "Portfolio Scout",
    description:
      "Tracks wallet balances, position changes, and portfolio concentration.",
    longDescription:
      "Snapshots wallet positions on a schedule and flags concentration, new entries, and exits.",
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
      "install or mirror the Portfolio Scout skill and explain its portfolio risk checks",
    samplePrompt:
      "Install Portfolio Scout and show me the report it produces every few hours.",
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
    badges: ["Managed skill", "Risk checks", "Wallet required"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/portfolio-scout",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/portfolio-scout/SKILL.md",
  },
  {
    id: "momentum-trader",
    name: "Momentum Trader",
    description:
      "Runs a repeatable momentum loop with dry-run mode, quotes, and trailing exits.",
    longDescription:
      "Scans gainers and trending coins, quotes entries, and manages exits from a local position state.",
    category: "trading",
    difficulty: "advanced",
    risk: "medium",
    riskLabel: "Execution skill, dedicated wallet required",
    tags: ["trading", "momentum", "quotes", "trailing-stops"],
    monitors: [
      "Momentum candidates",
      "Quote slippage",
      "Position count",
      "Daily spend cap",
      "Trailing stop exits",
    ],
    commands: [
      "zora explore --sort gainers --limit 12 --json",
      "zora explore --sort trending --limit 12 --json",
      "zora get <identifier> --json",
      "zora balance coins --sort usd-value --limit 20 --json",
      "zora buy <identifier> --eth <amount> --quote -o json",
      "zora buy <identifier> --eth <amount> --slippage <pct> -o json --yes",
      "zora sell <identifier> --percent 100 --to eth --slippage <pct> -o json --yes",
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
      "install or mirror the Momentum Trader skill and explain how its dry-run mode and trailing exits work",
    samplePrompt:
      "Install Momentum Trader and show me a dry-run cycle before I turn it live.",
    sampleOutput: `Momentum Trader
Run at 2026-03-23T13:40:00Z
Mode: dry-run

Open positions tracked: 1
- looksmaxxing, entry $0.00021, peak $0.00024, current $0.00023

Candidates:
1. hyperpop, +28.3%, $210K volume
   Quote: 0.01 ETH -> 263 HYPERPOP, slippage 1.2%
   Action: dry-run only, no order sent

No exits fired.
State saved to ~/.config/zora-agent-skills/momentum-trader/state.json`,
    badges: ["Managed skill", "Dry-run by default", "Execution"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/momentum-trader",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/momentum-trader/SKILL.md",
  },
];

export function getSkillById(id: string) {
  return skills.find((skill) => skill.id === id) ?? null;
}

export function getInstallAllCommands(baseUrl: string): SkillRuntimeCommands {
  const skillsUrl = `${baseUrl}/api/skills`;
  const prompt = `Read ${skillsUrl}. Install or mirror the Zora skills that fit this runtime. Use ${REPO_URL} for the entrypoint files.`;

  return {
    openclaw: skills.map((skill) => `clawhub install ${skill.id}`).join(" && "),
    claude: `claude -p "${prompt}"`,
    amp: `amp "${prompt}"`,
    codex: `codex "${prompt}"`,
    opencode: `opencode run "${prompt}"`,
    cursor: `cursor "${prompt}"`,
    manual: `git clone --depth 1 ${REPO_URL}`,
  };
}

export function getSkillRuntimeCommands(
  skill: Skill,
  baseUrl: string,
): SkillRuntimeCommands {
  const skillMdUrl = `${baseUrl}/skills/${skill.id}/skill-md`;
  const prompt = `Read ${skillMdUrl}. Use ${skill.githubUrl} for the entrypoint files. ${skill.actionPrompt}.`;

  return {
    openclaw: `clawhub install ${skill.id}`,
    claude: `claude -p "${prompt}"`,
    amp: `amp "${prompt}"`,
    codex: `codex "${prompt}"`,
    opencode: `opencode run "${prompt}"`,
    cursor: `cursor "${prompt}"`,
    manual: `git clone --depth 1 ${REPO_URL} && cd zora-agent-skills/${skill.id}`,
  };
}
