import {
  setApiKey,
  getCoinsTopGainers,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsTopVolume24h,
  getCreatorCoins,
  getFeaturedCreators,
  getTrendingAll,
  getTraderLeaderboard,
  getCoinsLastTraded,
  getCoinsLastTradedUnique,
  getProfileBalances,
} from "@zoralabs/coins-sdk";

const apiKey = process.env.ZORA_API_KEY;
if (apiKey) {
  setApiKey(apiKey);
}

export type SortOption =
  | "trending"
  | "mcap"
  | "new"
  | "volume"
  | "gainers"
  | "creators"
  | "featured"
  | "last-traded"
  | "last-traded-unique";

export interface CoinNode {
  name?: string;
  address?: string;
  symbol?: string;
  coinType?: string;
  marketCap?: string;
  volume24h?: string;
  marketCapDelta24h?: string;
  creatorAddress?: string;
  mediaContent?: {
    previewImage?: {
      medium?: string;
    };
  };
  uniqueHolders?: number;
  totalSupply?: string;
}

export interface TraderNode {
  address?: string;
  displayName?: string;
  volume?: string;
}

export interface ExploreApiResponse {
  coins: CoinNode[];
  sort: SortOption;
  count: number;
}

export interface LeaderboardApiResponse {
  traders: TraderNode[];
  count: number;
}

export interface ProfileBalance {
  balance?: string;
  balanceUsd?: string;
  coin?: {
    address?: string;
    coinType?: string;
    marketCap?: string;
    marketCapDelta24h?: string;
    mediaContent?: {
      previewImage?: {
        medium?: string;
      };
    };
    name?: string;
    symbol?: string;
    tokenPrice?: {
      priceInUsdc?: string;
    };
    totalSupply?: string;
  };
}

export interface PortfolioApiResponse {
  address: string;
  balances: ProfileBalance[];
  count: number;
}

interface ExploreEdge {
  node: CoinNode;
}

interface ExploreResponse {
  error?: unknown;
  data?: {
    exploreList?: {
      edges: ExploreEdge[];
    };
  };
}

interface ProfileBalanceEdge {
  node: ProfileBalance;
}

interface ProfileBalancesResponse {
  error?: unknown;
  data?: {
    profile?: {
      coinBalances?: {
        edges?: ProfileBalanceEdge[];
      };
    };
  };
}

const QUERY_MAP: Record<SortOption, (count: number) => Promise<ExploreResponse>> = {
  trending: (count) => getTrendingAll({ count }) as Promise<ExploreResponse>,
  mcap: (count) => getCoinsMostValuable({ count }) as Promise<ExploreResponse>,
  new: (count) => getCoinsNew({ count }) as Promise<ExploreResponse>,
  volume: (count) => getCoinsTopVolume24h({ count }) as Promise<ExploreResponse>,
  gainers: (count) => getCoinsTopGainers({ count }) as Promise<ExploreResponse>,
  creators: (count) => getCreatorCoins({ count }) as Promise<ExploreResponse>,
  featured: (count) => getFeaturedCreators({ first: count }) as Promise<ExploreResponse>,
  "last-traded": (count) => getCoinsLastTraded({ count }) as Promise<ExploreResponse>,
  "last-traded-unique": (count) => getCoinsLastTradedUnique({ count }) as Promise<ExploreResponse>,
};

export async function fetchCoins(
  sort: SortOption,
  count: number = 10
): Promise<CoinNode[]> {
  const queryFn = QUERY_MAP[sort];
  if (!queryFn) return [];

  const response = await queryFn(count);
  if (response.error) return [];

  return (
    response.data?.exploreList?.edges.map((e: ExploreEdge) => e.node) ?? []
  );
}


export async function fetchLeaderboard(
  count: number = 20
): Promise<TraderNode[]> {
  const response = await getTraderLeaderboard({ first: count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const leaderboard = data?.traderLeaderboard as
    | { edges?: Array<{ node: TraderNode }> }
    | undefined;
  return leaderboard?.edges?.map((e) => e.node) ?? [];
}

export async function fetchProfileBalances(
  address: string,
  count: number = 20
): Promise<ProfileBalance[]> {
  const response = (await getProfileBalances({
    identifier: address,
    count,
    sortOption: "MARKET_VALUE_USD",
    excludeHidden: true,
    chainIds: [8453],
  })) as ProfileBalancesResponse;

  if (response.error) {
    throw new Error("Failed to fetch profile balances.");
  }

  return response.data?.profile?.coinBalances?.edges?.map((edge) => edge.node) ?? [];
}

export function formatCompactCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatChange(
  marketCap: string | undefined,
  delta: string | undefined
): { value: string; positive: boolean | null } {
  if (!marketCap || !delta) return { value: "\u2014", positive: null };
  const cap = parseFloat(marketCap);
  const d = parseFloat(delta);
  if (isNaN(cap) || isNaN(d) || cap === 0) return { value: "\u2014", positive: null };
  const prevCap = cap - d;
  if (prevCap === 0) return { value: "\u2014", positive: null };
  const pct = (d / prevCap) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    value: `${sign}${pct.toFixed(1)}%`,
    positive: pct > 0 ? true : pct < 0 ? false : null,
  };
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function coinTypeLabel(coinType: string | undefined): string {
  switch (coinType) {
    case "CONTENT": return "post";
    case "CREATOR": return "creator-coin";
    case "TREND": return "trend";
    default: return coinType?.toLowerCase() ?? "unknown";
  }
}
