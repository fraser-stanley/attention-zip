import {
  setApiKey,
  getCoinsTopGainers,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsTopVolume24h,
  getCreatorCoins,
  getFeaturedCreators,
  getTraderLeaderboard,
  getCoin,
  getCoinSwaps,
  getCoinHolders,
  getTrendingAll,
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

export async function fetchLeaderboard(count: number = 20) {
  const response = await getTraderLeaderboard({ first: count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const leaderboard = data?.traderLeaderboard as { edges?: Array<{ node: Record<string, unknown> }> } | undefined;
  return leaderboard?.edges?.map((e) => e.node) ?? [];
}

export async function fetchCoinDetail(address: string) {
  const response = await getCoin({ address, chain: 8453 });
  if ((response as { error?: unknown }).error) return null;
  const data = response.data as Record<string, unknown> | undefined;
  return (data?.zora20Token as Record<string, unknown>) ?? null;
}

export async function fetchCoinSwapsData(address: string, count: number = 20) {
  const response = await getCoinSwaps({ address, chain: 8453, first: count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const token = data?.zora20Token as Record<string, unknown> | undefined;
  const edges = (token?.swaps as { edges?: Array<{ node: Record<string, unknown> }> })?.edges;
  return edges?.map((e) => e.node) ?? [];
}

export async function fetchCoinHoldersData(address: string, count: number = 20) {
  const response = await getCoinHolders({ chainId: 8453, address, count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const token = data?.zora20Token as Record<string, unknown> | undefined;
  const edges = (token?.holders as { edges?: Array<{ node: Record<string, unknown> }> })?.edges;
  return edges?.map((e) => e.node) ?? [];
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

export async function fetchProfileBalances(identifier: string, count: number = 20) {
  const response = await getProfileBalances({ identifier, count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const profile = data?.profile as Record<string, unknown> | undefined;
  const balances = profile?.coinBalances as { edges?: Array<{ node: Record<string, unknown> }> } | undefined;
  return balances?.edges?.map((e) => e.node) ?? [];
}

export async function fetchProfileCoins(identifier: string, count: number = 20) {
  const response = await getProfileCoins({ identifier, count });
  if ((response as { error?: unknown }).error) return [];
  const data = response.data as Record<string, unknown> | undefined;
  const profile = data?.profile as Record<string, unknown> | undefined;
  const coins = profile?.createdCoins as { edges?: Array<{ node: Record<string, unknown> }> } | undefined;
  return coins?.edges?.map((e) => e.node) ?? [];
}
