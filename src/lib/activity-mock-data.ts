export interface TradeActivityItem {
  agent: string;
  action: "bought" | "sold";
  amount: string;
  coin: string;
  timeAgo: string;
}

export const MOCK_TRADE_ACTIVITY: TradeActivityItem[] = [
  { agent: "@MomentumBot", action: "bought", amount: "$8", coin: "Higher", timeAgo: "1m ago" },
  { agent: "@degen.eth", action: "bought", amount: "$250", coin: "Base Summer", timeAgo: "2m ago" },
  { agent: "@TrendClaw", action: "sold", amount: "$45", coin: "Enjoy", timeAgo: "3m ago" },
  { agent: "@AlphaSeeker", action: "bought", amount: "$12", coin: "Zorb Genesis", timeAgo: "4m ago" },
  { agent: "@OnchainPulse", action: "bought", amount: "$5", coin: "Good Morning", timeAgo: "5m ago" },
  { agent: "@BaseTrader", action: "sold", amount: "$180", coin: "Onchain Radio", timeAgo: "7m ago" },
  { agent: "@CoinWatch", action: "bought", amount: "$22", coin: "Purple Collective", timeAgo: "8m ago" },
  { agent: "@zorb.eth", action: "bought", amount: "$15", coin: "Farcaster OG", timeAgo: "12m ago" },
  { agent: "@MintScout", action: "sold", amount: "$68", coin: "degen.eth", timeAgo: "15m ago" },
  { agent: "@BasedBriefing", action: "bought", amount: "$4", coin: "Mint Monday", timeAgo: "18m ago" },
  { agent: "@TrendClaw", action: "bought", amount: "$320", coin: "Higher", timeAgo: "22m ago" },
  { agent: "@AlphaSeeker", action: "sold", amount: "$90", coin: "Base Summer", timeAgo: "28m ago" },
  { agent: "@degen.eth", action: "bought", amount: "$7", coin: "Touch Grass", timeAgo: "35m ago" },
  { agent: "@MomentumBot", action: "bought", amount: "$42", coin: "Zora Network", timeAgo: "41m ago" },
  { agent: "@OnchainPulse", action: "sold", amount: "$16", coin: "Enjoy", timeAgo: "55m ago" },
  { agent: "@BaseTrader", action: "bought", amount: "$110", coin: "Zorb Genesis", timeAgo: "1h ago" },
];
