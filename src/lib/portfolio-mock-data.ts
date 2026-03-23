export interface MockPosition {
  coin: string;
  symbol: string;
  address: string;
  coinType: "CREATOR" | "CONTENT" | "TREND";
  status: "active" | "resolved";
  side: "long";
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  pnl: number;
  pnlPct: number;
}

export interface MockTrade {
  coin: string;
  side: "buy" | "sell";
  amount: number;
  pnl: number;
  pct: number;
  date: string;
}

export interface MockPortfolioPnl {
  totalPnl: number;
  totalPnlPct: number;
  realizedPnl: number;
  unrealizedPnl: number;
  winRate: number;
  totalTrades: number;
  wins: number;
  losses: number;
}

export interface SparklinePoint {
  value: number;
  bornTick?: number;
}

export interface MockPortfolio {
  address: string;
  handle: string;
  totalValue: number;
  pnl: MockPortfolioPnl;
  positions: MockPosition[];
  recentTrades: MockTrade[];
  installedSkillIds: string[];
  sparkline: SparklinePoint[];
}

export const MOCK_PORTFOLIO: MockPortfolio = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  handle: "vitalik.eth",
  totalValue: 11_390.87,
  pnl: {
    totalPnl: 4_821.37,
    totalPnlPct: 18.4,
    realizedPnl: 2_130.5,
    unrealizedPnl: 2_690.87,
    winRate: 64,
    totalTrades: 47,
    wins: 30,
    losses: 17,
  },
  positions: [
    {
      coin: "Enjoy",
      symbol: "ENJOY",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      coinType: "TREND",
      status: "active",
      side: "long",
      entryPrice: 2_000,
      currentPrice: 3_240,
      quantity: 12_500,
      entryDate: "Mar 8",
      pnl: 1_240.0,
      pnlPct: 62.0,
    },
    {
      coin: "Higher",
      symbol: "HIGHER",
      address: "0x2345678901abcdef2345678901abcdef23456789",
      coinType: "TREND",
      status: "active",
      side: "long",
      entryPrice: 1_500,
      currentPrice: 1_910.2,
      quantity: 8_000,
      entryDate: "Mar 10",
      pnl: 410.2,
      pnlPct: 27.3,
    },
    {
      coin: "Imagine",
      symbol: "IMAGINE",
      address: "0x3456789012abcdef3456789012abcdef34567890",
      coinType: "CONTENT",
      status: "active",
      side: "long",
      entryPrice: 800,
      currentPrice: 679.56,
      quantity: 5_200,
      entryDate: "Mar 11",
      pnl: -120.44,
      pnlPct: -15.1,
    },
    {
      coin: "Zora",
      symbol: "ZORA",
      address: "0x4567890123abcdef4567890123abcdef45678901",
      coinType: "CREATOR",
      status: "active",
      side: "long",
      entryPrice: 3_200,
      currentPrice: 3_864.95,
      quantity: 20_000,
      entryDate: "Mar 6",
      pnl: 664.95,
      pnlPct: 20.8,
    },
    {
      coin: "Base Summer",
      symbol: "BSUMMER",
      address: "0x5678901234abcdef5678901234abcdef56789012",
      coinType: "TREND",
      status: "active",
      side: "long",
      entryPrice: 1_200,
      currentPrice: 1_143.08,
      quantity: 6_400,
      entryDate: "Mar 12",
      pnl: -56.92,
      pnlPct: -4.7,
    },
    {
      coin: "Degen",
      symbol: "DEGEN",
      address: "0x6789012345abcdef6789012345abcdef67890123",
      coinType: "TREND",
      status: "resolved",
      side: "long",
      entryPrice: 2_000,
      currentPrice: 1_619.75,
      quantity: 10_000,
      entryDate: "Mar 3",
      exitDate: "Mar 9",
      pnl: -380.25,
      pnlPct: -19.1,
    },
    {
      coin: "Farcaster",
      symbol: "FC",
      address: "0x7890123456abcdef7890123456abcdef78901234",
      coinType: "CREATOR",
      status: "resolved",
      side: "long",
      entryPrice: 1_800,
      currentPrice: 2_034.0,
      quantity: 9_000,
      entryDate: "Mar 1",
      exitDate: "Mar 7",
      pnl: 234.0,
      pnlPct: 13.0,
    },
    {
      coin: "Nouns",
      symbol: "NOUNS",
      address: "0x8901234567abcdef8901234567abcdef89012345",
      coinType: "CONTENT",
      status: "resolved",
      side: "long",
      entryPrice: 600,
      currentPrice: 676.75,
      quantity: 3_000,
      entryDate: "Feb 28",
      exitDate: "Mar 5",
      pnl: 76.75,
      pnlPct: 12.8,
    },
  ],
  recentTrades: [
    { coin: "ENJOY", side: "buy", amount: 2_000, pnl: 1_240.0, pct: 62.0, date: "Mar 14" },
    { coin: "HIGHER", side: "sell", amount: 1_500, pnl: 410.2, pct: 27.3, date: "Mar 13" },
    { coin: "DEGEN", side: "buy", amount: 2_000, pnl: -380.25, pct: -19.1, date: "Mar 12" },
    { coin: "IMAGINE", side: "buy", amount: 800, pnl: 195.6, pct: 24.5, date: "Mar 11" },
    { coin: "ZORA", side: "sell", amount: 3_200, pnl: 664.95, pct: 20.8, date: "Mar 10" },
  ],
  installedSkillIds: ["trend-scout", "portfolio-scout"],
  sparkline: [
    { value: 0 },
    { value: 180 },
    { value: 120 },
    { value: 420 },
    { value: 380 },
    { value: 610 },
    { value: 850 },
    { value: 790 },
    { value: 1_020 },
    { value: 1_280 },
    { value: 1_450 },
    { value: 1_380 },
    { value: 1_620 },
    { value: 1_900 },
    { value: 1_750 },
    { value: 2_100 },
    { value: 2_400 },
    { value: 2_650 },
    { value: 2_900 },
    { value: 2_780 },
    { value: 3_100 },
    { value: 3_450 },
    { value: 3_800 },
    { value: 3_650 },
    { value: 4_000 },
    { value: 4_300 },
    { value: 4_550 },
    { value: 4_700 },
    { value: 4_900 },
    { value: 4_821.37 },
  ],
};
