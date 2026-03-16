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
  getProfileBalances,
  getProfileCoins,
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
  | "featured";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QUERY_MAP: Record<SortOption, (count: number) => Promise<ExploreResponse>> = {
  trending: (count) => getTrendingAll({ count }) as Promise<ExploreResponse>,
  mcap: (count) => getCoinsMostValuable({ count }) as Promise<ExploreResponse>,
  new: (count) => getCoinsNew({ count }) as Promise<ExploreResponse>,
  volume: (count) => getCoinsTopVolume24h({ count }) as Promise<ExploreResponse>,
  gainers: (count) => getCoinsTopGainers({ count }) as Promise<ExploreResponse>,
  creators: (count) => getCreatorCoins({ count }) as Promise<ExploreResponse>,
  featured: (count) => getFeaturedCreators({ first: count }) as Promise<ExploreResponse>,
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

export function formatCompactCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
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

// --- Agent profile types and fetchers ---

export interface BalanceNode {
  balance: string;
  coin?: {
    name: string;
    address: string;
    symbol: string;
    coinType: "CREATOR" | "CONTENT" | "TREND";
    marketCap: string;
    marketCapDelta24h: string;
    volume24h: string;
    totalSupply: string;
    tokenPrice?: {
      priceInUsdc?: string;
    };
  };
}

export interface ProfileData {
  handle?: string;
  avatar?: string;
  balances: BalanceNode[];
  balanceCount: number;
  coins: CoinNode[];
  coinCount: number;
  totalValueUsd: number;
}

export interface AgentProfileApiResponse {
  address: string;
  volume?: string;
  leaderboardRank?: number;
  profile: ProfileData;
}

export async function fetchProfileBalanceNodes(
  address: string,
  count: number = 20
): Promise<{ balances: BalanceNode[]; totalCount: number; handle?: string; avatar?: string }> {
  const response = await getProfileBalances({ identifier: address, count });
  if ((response as { error?: unknown }).error) return { balances: [], totalCount: 0 };

  const data = response.data as Record<string, unknown> | undefined;
  const profile = data?.profile as Record<string, unknown> | undefined;
  if (!profile) return { balances: [], totalCount: 0 };

  const handle = profile.handle as string | undefined;
  const avatarObj = profile.avatar as { previewImage?: { small?: string } } | undefined;
  const avatar = avatarObj?.previewImage?.small;

  const coinBalances = profile.coinBalances as
    | { count?: number; edges?: Array<{ node: BalanceNode }> }
    | undefined;

  return {
    balances: coinBalances?.edges?.map((e) => e.node) ?? [],
    totalCount: coinBalances?.count ?? 0,
    handle,
    avatar,
  };
}

export async function fetchProfileCoinNodes(
  address: string,
  count: number = 20
): Promise<CoinNode[]> {
  const response = await getProfileCoins({ identifier: address, count });
  if ((response as { error?: unknown }).error) return [];

  const data = response.data as Record<string, unknown> | undefined;
  const profile = data?.profile as Record<string, unknown> | undefined;
  const createdCoins = profile?.createdCoins as
    | { edges?: Array<{ node: CoinNode }> }
    | undefined;

  return createdCoins?.edges?.map((e) => e.node) ?? [];
}
