export interface Skill {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  risk: "none" | "low" | "medium";
  riskLabel: string;
  monitors: string[];
  wraps: string[];
  installCommand: string;
  samplePrompt: string;
  sampleOutput: string;
  badges: string[];
  githubUrl: string;
  skillMdUrl: string;
  installs: number;
}

export interface SkillInstallCommands {
  cli: string;
  openclaw: string;
  manual: string;
}

export const skills: Skill[] = [
  {
    id: "trend-scout",
    name: "Trend Scout",
    description: "Trending coins, new launches, gainers, and momentum signals.",
    longDescription:
      "Watches trending coins, new launches, and top gainers on Zora.",
    risk: "none",
    riskLabel: "Read-only \u2014 no wallet needed",
    monitors: [
      "Trending coins",
      "New coin launches",
      "Top gainers (24h)",
      "Volume spikes",
    ],
    wraps: [
      "zora explore --sort trending --json",
      "zora explore --sort new --json",
      "zora explore --sort gainers --json",
    ],
    installCommand: "npx zora-cli install",
    samplePrompt:
      "Check Zora for trending coins with significant price movement in the last 24 hours.",
    sampleOutput: `Found 3 trending coins with notable movement:

1. looksmaxxing (trend) \u2014 $2.3M mcap, +12.3% 24h
   Address: 0x1234...5678
   Volume: $450.2K

2. hyperpop (trend) \u2014 $950.2K mcap, +22.8% 24h
   Address: 0xabcd...ef01
   Volume: $210.4K

3. based penguin (trend) \u2014 $780.5K mcap, +31.2% 24h
   Address: 0x9876...5432
   Volume: $95.6K`,
    badges: ["Works with OpenClaw", "Zora CLI ready", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/trend-scout",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/trend-scout/SKILL.md",
    installs: 1247,
  },
  {
    id: "creator-pulse",
    name: "Creator Pulse",
    description:
      "Track creators, their coins, and holdings.",
    longDescription:
      "Tracks creator coins and featured creators with watchlist alerts.",
    risk: "none",
    riskLabel: "Read-only \u2014 no wallet needed",
    monitors: [
      "Creator coin ecosystems",
      "Featured creators",
      "Creator holdings changes",
      "Creator coin volume",
    ],
    wraps: [
      "zora explore --type creator-coin --json",
      "zora explore --sort featured --json",
      "zora get <address> --json",
    ],
    installCommand: "npx zora-cli install",
    samplePrompt:
      "Show me the top featured creators on Zora and any recent activity on my watchlist.",
    sampleOutput: `Featured creators update:

1. jacob (creator-coin) \u2014 $8.1M mcap, -3.4% 24h
   Holders: 2,341 | Volume: $1.2M

2. alysaliu (creator-coin) \u2014 $4.2M mcap, +5.7% 24h
   Holders: 1,890 | Volume: $890.3K

Watchlist alert:
\u26a0 jacob saw a 15% volume increase in the last hour.`,
    badges: ["Works with OpenClaw", "Zora CLI ready", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/creator-pulse",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/creator-pulse/SKILL.md",
    installs: 892,
  },
  {
    id: "briefing-bot",
    name: "Briefing Bot",
    description:
      'Scheduled digest: "what changed on Zora since last check?"',
    longDescription:
      "Pulls market data into a structured morning or evening briefing.",
    risk: "none",
    riskLabel: "Read-only \u2014 no wallet needed",
    monitors: [
      "Market-wide trends",
      "Volume leaders",
      "New launches",
      "Creator coin movements",
      "Leaderboard changes",
    ],
    wraps: [
      "zora explore --sort trending --json",
      "zora explore --sort volume --json",
      "zora explore --sort new --json",
      "zora explore --type creator-coin --json",
    ],
    installCommand: "npx zora-cli install",
    samplePrompt: "Give me my morning Zora briefing.",
    sampleOutput: `Zora Morning Briefing \u2014 Mar 14, 2026

Trending: "looksmaxxing" leads at $2.3M mcap (+12.3%).
3 new coins launched overnight, largest at $45K mcap.

Volume leaders: "frog market" at $3.1M 24h vol (-8.1%).
Creator coins: jacob steady at $8.1M, alysaliu up 5.7%.

Leaderboard: 0xd8dA...6045 climbed to #3 with $42K weekly volume.

Nothing unusual detected. Market is moderately active.`,
    badges: ["Works with OpenClaw", "Zora CLI ready", "Read-only"],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/briefing-bot",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/briefing-bot/SKILL.md",
    installs: 2103,
  },
  {
    id: "portfolio-scout",
    name: "Portfolio Scout",
    description:
      "Coin holdings and portfolio value. Read-only, Bankr-ready.",
    longDescription:
      "Checks your wallet's Zora coin holdings via CLI, or any wallet via SDK.",
    risk: "none",
    riskLabel: "Read-only — local wallet or address",
    monitors: [
      "Coin holdings and values",
      "Portfolio composition",
      "Holdings changes over time",
    ],
    wraps: [
      "zora balances --json",
      "@zoralabs/coins-sdk → getProfileBalances()",
    ],
    installCommand: "npx zora-cli install",
    samplePrompt:
      "Check my Zora coin holdings.",
    sampleOutput: `Coin Holdings (local wallet):

1. jacob (creator-coin) — 1,200 tokens
   Value: $4,120 | +8.3% 24h

2. looksmaxxing (CONTENT) — 500 tokens
   Value: $1,150 | +12.1% 24h

3. based penguin (CONTENT) — 2,000 tokens
   Value: $780 | -3.2% 24h

Total value: ~$6,050
Coins held: 3`,
    badges: [
      "Works with OpenClaw",
      "Bankr-ready",
      "Zora CLI ready",
      "Read-only",
    ],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/portfolio-scout",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/portfolio-scout/SKILL.md",
    installs: 634,
  },
  {
    id: "momentum-trader",
    name: "Momentum Trader",
    description:
      "Auto-buys trending Zora coins on momentum signals via Zora CLI.",
    longDescription:
      "Monitors momentum signals and executes buys through Zora CLI on Base.",
    risk: "medium",
    riskLabel: "Execution-capable — dedicated wallet required",
    monitors: [
      "Trend Scout momentum signals",
      "Volume spike detection",
      "New launch sniping window",
      "Position P&L and trailing stops",
      "Cooldown and rate limits",
    ],
    wraps: [
      "zora explore --sort gainers --json",
      "zora buy <address> --eth <amount> --json",
      "zora sell <address> --amount <tokens> --json",
    ],
    installCommand: "npx zora-cli install",
    samplePrompt:
      "Watch Zora for coins with >20% gains and >$100K volume in the last hour. Auto-buy up to 0.05 ETH per position, max 3 positions. Set a 15% trailing stop.",
    sampleOutput: `Momentum Trader active — scanning gainers...

Signal detected:
  hyperpop — +28.3% 1h, $210K vol, $950K mcap
  Meets criteria: >20% gain, >$100K volume

Executing buy via Zora CLI:
  Bought 0.05 ETH of hyperpop at $0.00019/token
  Position: 263 tokens | Entry: $0.00019
  Trailing stop set: -15% from peak

\u26a0 Buy skipped: frog market — slippage too high (4.2% > max 3%). Will retry in 30s.

Active positions (2/3):
  1. hyperpop — +4.2% since entry, stop at $0.000185
  2. looksmaxxing — +11.8% since entry, stop at $0.000210

Watching for next signal... (cooldown: 5 min)`,
    badges: [
      "Execution",
      "Zora CLI native",
      "Requires trader wallet",
    ],
    githubUrl:
      "https://github.com/fraser-stanley/zora-agent-skills/tree/main/momentum-trader",
    skillMdUrl:
      "https://raw.githubusercontent.com/fraser-stanley/zora-agent-skills/main/momentum-trader/SKILL.md",
    installs: 312,
  },
];

export function getSkillById(id: string) {
  return skills.find((skill) => skill.id === id) ?? null;
}

export function getSkillInstallCommands(skill: Skill): SkillInstallCommands {
  return {
    cli: `install skill from ${skill.skillMdUrl}`,
    openclaw: `install skill from ${skill.skillMdUrl}`,
    manual: `curl -O ${skill.skillMdUrl}`,
  };
}
