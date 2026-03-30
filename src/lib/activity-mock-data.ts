import type { ActivityFeedItem } from "@/lib/zora";

export type TradeActivityItem = ActivityFeedItem;

const MOCK_ACTIVITY_ENTRIES = [
  { trader: "@MomentumBot", action: "bought", amount: "$8", coin: "Higher", minutesAgo: 1 },
  { trader: "@degen.eth", action: "bought", amount: "$250", coin: "Base Summer", minutesAgo: 2 },
  { trader: "@TrendClaw", action: "sold", amount: "$45", coin: "Enjoy", minutesAgo: 3 },
  { trader: "@AlphaSeeker", action: "bought", amount: "$12", coin: "Zorb Genesis", minutesAgo: 4 },
  { trader: "@OnchainPulse", action: "bought", amount: "$5", coin: "Good Morning", minutesAgo: 5 },
  { trader: "@BaseTrader", action: "sold", amount: "$180", coin: "Onchain Radio", minutesAgo: 7 },
  { trader: "@CoinWatch", action: "bought", amount: "$22", coin: "Purple Collective", minutesAgo: 8 },
  { trader: "@zorb.eth", action: "bought", amount: "$15", coin: "Farcaster OG", minutesAgo: 12 },
  { trader: "@MintScout", action: "sold", amount: "$68", coin: "degen.eth", minutesAgo: 15 },
  { trader: "@BasedBriefing", action: "bought", amount: "$4", coin: "Mint Monday", minutesAgo: 18 },
  { trader: "@TrendClaw", action: "bought", amount: "$320", coin: "Higher", minutesAgo: 22 },
  { trader: "@AlphaSeeker", action: "sold", amount: "$90", coin: "Base Summer", minutesAgo: 28 },
  { trader: "@degen.eth", action: "bought", amount: "$7", coin: "Touch Grass", minutesAgo: 35 },
  { trader: "@MomentumBot", action: "bought", amount: "$42", coin: "Zora Network", minutesAgo: 41 },
  { trader: "@OnchainPulse", action: "sold", amount: "$16", coin: "Enjoy", minutesAgo: 55 },
  { trader: "@BaseTrader", action: "bought", amount: "$110", coin: "Zorb Genesis", minutesAgo: 60 },
] as const;

const now = Date.now();

export const MOCK_TRADE_ACTIVITY: TradeActivityItem[] = MOCK_ACTIVITY_ENTRIES.map(
  (entry, index) => ({
    id: `mock-trade-${index}`,
    trader: entry.trader,
    action: entry.action,
    amount: entry.amount,
    coin: entry.coin,
    timestamp: new Date(now - entry.minutesAgo * 60_000).toISOString(),
  }),
);
