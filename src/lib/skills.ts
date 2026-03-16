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
}

export interface SkillInstallCommands {
  claude: string;
  openclaw: string;
  manual: string;
}

export const skills: Skill[] = [
  {
    id: "trend-scout",
    name: "Trend Scout",
    description: "Fast-moving opportunities: new launches, gainers, momentum.",
    longDescription:
      "Watches trending coins, new launches, and top gainers on Zora. Your agent gets coin name, address, market cap, volume, and 24h change as structured data. Good for spotting momentum before it shows up on dashboards.",
    risk: "none",
    riskLabel: "Read-only \u2014 no wallet needed",
    monitors: [
      "Trending coins",
      "New coin launches",
      "Top gainers (24h)",
      "Volume spikes",
    ],
    wraps: [
      "zora explore --sort trending -o json",
      "zora explore --sort new -o json",
      "zora explore --sort gainers -o json",
    ],
    installCommand:
      'install skill from https://github.com/fraser-stanley/zora-agent-skills/tree/main/trend-scout',
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
  },
  {
    id: "creator-pulse",
    name: "Creator Pulse",
    description:
      "Watch specific creators, creator-coin ecosystems, and holdings.",
    longDescription:
      "Tracks creator coins and featured creators on Zora. Set up a watchlist and get alerts when activity spikes. Covers holdings, volume, and price movement for specific creators you care about.",
    risk: "none",
    riskLabel: "Read-only \u2014 no wallet needed",
    monitors: [
      "Creator coin ecosystems",
      "Featured creators",
      "Creator holdings changes",
      "Creator coin volume",
    ],
    wraps: [
      "zora explore --type creator-coin -o json",
      "zora explore --sort featured -o json",
      "zora get <address> -o json",
    ],
    installCommand:
      'install skill from https://github.com/fraser-stanley/zora-agent-skills/tree/main/creator-pulse',
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
  },
  {
    id: "briefing-bot",
    name: "Briefing Bot",
    description:
      'Scheduled digest: "what changed on Zora since last check?"',
    longDescription:
      "Pulls trending, volume, creator, and new-launch data into a morning or evening briefing. You get a short summary instead of raw numbers. Useful if you don't want to check dashboards yourself.",
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
      "zora explore --sort trending -o json",
      "zora explore --sort volume -o json",
      "zora explore --sort new -o json",
      "zora explore --type creator-coin -o json",
    ],
    installCommand:
      'install skill from https://github.com/fraser-stanley/zora-agent-skills/tree/main/briefing-bot',
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
  },
  {
    id: "portfolio-scout",
    name: "Portfolio Scout",
    description:
      "Read-only wallet balance and coin holdings check. Bankr-ready.",
    longDescription:
      "Check any wallet's Zora coin holdings and ETH balance. Uses the same read-only wallet-check pattern Bankr agents already use. No private key needed — just a wallet address. Use this today with your Bankr wallet, add execution skills tomorrow.",
    risk: "none",
    riskLabel: "Read-only — wallet address only",
    monitors: [
      "Wallet ETH balance",
      "Coin holdings and values",
      "Portfolio composition",
      "Holdings changes over time",
    ],
    wraps: [
      "zora profile balances <address> -o json",
      "zora profile coins <address> -o json",
    ],
    installCommand:
      'install skill from https://github.com/fraser-stanley/zora-agent-skills/tree/main/portfolio-scout',
    samplePrompt:
      "Check my Zora portfolio at 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.",
    sampleOutput: `Portfolio for 0xd8dA...6045

ETH Balance: 2.34 ETH ($7,800)

Coin Holdings:
1. jacob (creator-coin) — 1,200 tokens
   Value: $4,120 | +8.3% 24h

2. looksmaxxing (trend) — 500 tokens
   Value: $1,150 | +12.1% 24h

3. based penguin (trend) — 2,000 tokens
   Value: $780 | -3.2% 24h

Total portfolio: ~$13,850
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
  },
];

export function getSkillById(id: string) {
  return skills.find((skill) => skill.id === id) ?? null;
}

export function getSkillInstallCommands(skill: Skill): SkillInstallCommands {
  return {
    claude: `claude skill add ${skill.githubUrl}`,
    openclaw: skill.installCommand,
    manual: `curl -O ${skill.skillMdUrl}`,
  };
}
