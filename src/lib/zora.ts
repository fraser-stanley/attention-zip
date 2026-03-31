import {
  setApiKey,
  getCoinsTopGainers,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsTopVolume24h,
  getCreatorCoins,
  getFeaturedCreators,
  getTrendingAll,
  getTrendingTrends,
  getTopVolumeTrends24h,
  getTraderLeaderboard,
  getCoinsLastTraded,
  getCoinsLastTradedUnique,
  getCoinSwaps,
  getProfile,
  getProfileBalances,
} from "@zoralabs/coins-sdk";
import { normalizeWalletAddress } from "@/lib/wallet-address";

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
  | "trends"
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
  volume?: string | number;
  tradesCount?: number;
  score?: number;
  profileId?: string;
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

export interface LinkedWallet {
  walletAddress: string;
  walletType?: string;
}

export interface ProfileIdentity {
  identifier: string;
  handle?: string;
  walletAddress?: string;
  linkedWallets: LinkedWallet[];
  profileId?: string;
  avatar?: {
    medium?: string;
    small?: string;
  };
}

export interface CoinSwapActivity {
  id?: string;
  coinAddress: string;
  senderAddress?: string;
  recipientAddress?: string;
  transactionHash?: string;
  blockTimestamp?: string;
  activityType?: "BUY" | "SELL";
  coinAmount?: string;
  quoteAmount?: number;
  quoteCurrencyAddress?: string;
  quotePriceUsdc?: string;
  senderProfileHandle?: string;
}

export interface CoinSwapsPageInfo {
  endCursor?: string;
  hasNextPage: boolean;
}

export interface CoinSwapsApiResponse {
  coinAddress: string;
  count: number;
  pageInfo: CoinSwapsPageInfo;
  swaps: CoinSwapActivity[];
}

export interface ActivityFeedItem {
  id: string;
  trader: string;
  action: "bought" | "sold";
  amount: string;
  coin: string;
  timestamp: string;
}

export interface ActivityApiResponse {
  items: ActivityFeedItem[];
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

interface LeaderboardProfile {
  handle?: string;
  id?: string;
}

interface CurrentLeaderboardEdge {
  node?: {
    score?: number;
    weekVolumeUsd?: number;
    weekTradesCount?: number;
    traderProfile?: LeaderboardProfile;
  };
}

interface CurrentLeaderboardResponse {
  error?: unknown;
  data?: {
    exploreTraderLeaderboard?: {
      edges?: CurrentLeaderboardEdge[];
    };
  };
}

interface LegacyLeaderboardResponse {
  error?: unknown;
  data?: {
    traderLeaderboard?: {
      edges?: Array<{ node: TraderNode }>;
    };
  };
}

interface ProfileLinkedWalletEdge {
  node?: {
    walletAddress?: string;
    walletType?: string;
  };
}

interface ProfileResponse {
  error?: unknown;
  data?: {
    profile?: {
      id?: string;
      handle?: string;
      publicWallet?: {
        walletAddress?: string;
      };
      linkedWallets?: {
        edges?: ProfileLinkedWalletEdge[];
      };
      avatar?: {
        previewImage?: {
          medium?: string;
          small?: string;
        };
      };
    };
  };
}

interface CoinSwapEdge {
  node?: {
    id?: string;
    senderAddress?: string;
    recipientAddress?: string;
    transactionHash?: string;
    blockTimestamp?: string;
    activityType?: "BUY" | "SELL";
    coinAmount?: string;
    senderProfile?: {
      handle?: string;
    };
    currencyAmountWithPrice?: {
      priceUsdc?: string;
      currencyAmount?: {
        currencyAddress?: string;
        amountDecimal?: number;
      };
    };
  };
}

interface CoinSwapsResponse {
  error?: unknown;
  data?: {
    zora20Token?: {
      swapActivities?: {
        count?: number;
        edges?: CoinSwapEdge[];
        pageInfo?: {
          endCursor?: string;
          hasNextPage?: boolean;
        };
      };
    };
  };
}

const QUERY_MAP: Partial<Record<SortOption, (count: number) => Promise<ExploreResponse>>> = {
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

async function fetchTrends(count: number): Promise<CoinNode[]> {
  const [trendingRes, volumeRes] = await Promise.all([
    getTrendingTrends({ count }) as Promise<ExploreResponse>,
    getTopVolumeTrends24h({ count }) as Promise<ExploreResponse>,
  ]);

  const trendingNodes =
    trendingRes.data?.exploreList?.edges.map((e: ExploreEdge) => e.node) ?? [];
  const volumeNodes =
    volumeRes.data?.exploreList?.edges.map((e: ExploreEdge) => e.node) ?? [];

  // Interleave trending and volume, deduplicate by address
  const seen = new Set<string>();
  const merged: CoinNode[] = [];
  const maxLen = Math.max(trendingNodes.length, volumeNodes.length);

  for (let i = 0; i < maxLen && merged.length < count; i++) {
    for (const node of [trendingNodes[i], volumeNodes[i]]) {
      if (!node || merged.length >= count) continue;
      const addr = node.address?.toLowerCase();
      if (addr && seen.has(addr)) continue;
      if (addr) seen.add(addr);
      merged.push(node);
    }
  }

  return merged;
}

export async function fetchCoins(
  sort: SortOption,
  count: number = 10
): Promise<CoinNode[]> {
  if (sort === "trends") return fetchTrends(count);

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
  return extractLeaderboardTraders(response);
}

export function extractLeaderboardTraders(response: unknown): TraderNode[] {
  const result = response as CurrentLeaderboardResponse & LegacyLeaderboardResponse;
  if (result.error) return [];

  const currentEdges = result.data?.exploreTraderLeaderboard?.edges;
  if (currentEdges) {
    return currentEdges
      .map((edge) => {
        const handle = edge.node?.traderProfile?.handle;
        const normalizedAddress =
          typeof handle === "string" && /^0x[a-fA-F0-9]{40}$/.test(handle)
            ? handle
            : undefined;

        return {
          address: normalizedAddress,
          displayName: handle,
          volume: edge.node?.weekVolumeUsd,
          tradesCount: edge.node?.weekTradesCount,
          score: edge.node?.score,
          profileId: edge.node?.traderProfile?.id,
        };
      })
      .filter(
        (trader) =>
          typeof trader.displayName === "string" ||
          typeof trader.address === "string" ||
          trader.volume !== undefined,
      );
  }

  return result.data?.traderLeaderboard?.edges?.map((edge) => edge.node) ?? [];
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

export function extractProfileIdentity(
  identifier: string,
  response: unknown,
): ProfileIdentity | null {
  const result = response as ProfileResponse;
  if (result.error) return null;

  const profile = result.data?.profile;
  if (!profile) return null;

  const linkedWallets =
    profile.linkedWallets?.edges?.reduce<LinkedWallet[]>((wallets, edge) => {
      const walletAddress = normalizeWalletAddress(edge.node?.walletAddress);
      if (!walletAddress) {
        return wallets;
      }

      wallets.push({
        walletAddress,
        ...(edge.node?.walletType
          ? { walletType: edge.node.walletType }
          : {}),
      });

      return wallets;
    }, []) ?? [];

  const walletAddress =
    normalizeWalletAddress(profile.publicWallet?.walletAddress) ??
    linkedWallets[0]?.walletAddress ??
    normalizeWalletAddress(identifier) ??
    undefined;

  return {
    identifier,
    handle: profile.handle,
    walletAddress,
    linkedWallets,
    profileId: profile.id,
    avatar: {
      medium: profile.avatar?.previewImage?.medium,
      small: profile.avatar?.previewImage?.small,
    },
  };
}

export async function fetchProfile(
  identifier: string,
): Promise<ProfileIdentity | null> {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const response = (await getProfile({
    identifier: normalizedIdentifier,
  })) as ProfileResponse;

  if (response.error) {
    throw new Error("Failed to fetch profile.");
  }

  return extractProfileIdentity(normalizedIdentifier, response);
}

export function extractCoinSwaps(
  coinAddress: string,
  response: unknown,
): CoinSwapsApiResponse {
  const result = response as CoinSwapsResponse;
  if (result.error) {
    return {
      coinAddress,
      count: 0,
      pageInfo: {
        hasNextPage: false,
      },
      swaps: [],
    };
  }

  const swapActivities = result.data?.zora20Token?.swapActivities;
  const swaps =
    swapActivities?.edges?.map((edge) => {
      const amountDecimal =
        edge.node?.currencyAmountWithPrice?.currencyAmount?.amountDecimal;

      return {
        id: edge.node?.id,
        coinAddress,
        senderAddress: edge.node?.senderAddress,
        recipientAddress: edge.node?.recipientAddress,
        transactionHash: edge.node?.transactionHash,
        blockTimestamp: edge.node?.blockTimestamp,
        activityType: edge.node?.activityType,
        coinAmount: edge.node?.coinAmount,
        quoteAmount:
          typeof amountDecimal === "number" && Number.isFinite(amountDecimal)
            ? amountDecimal
            : undefined,
        quoteCurrencyAddress:
          edge.node?.currencyAmountWithPrice?.currencyAmount?.currencyAddress,
        quotePriceUsdc: edge.node?.currencyAmountWithPrice?.priceUsdc,
        senderProfileHandle: edge.node?.senderProfile?.handle,
      };
    }) ?? [];

  return {
    coinAddress,
    count: swapActivities?.count ?? swaps.length,
    pageInfo: {
      endCursor: swapActivities?.pageInfo?.endCursor,
      hasNextPage: swapActivities?.pageInfo?.hasNextPage ?? false,
    },
    swaps,
  };
}

export async function fetchCoinSwaps(
  address: string,
  count: number = 20,
  after?: string,
): Promise<CoinSwapsApiResponse> {
  const response = (await getCoinSwaps({
    address,
    chain: 8453,
    first: count,
    ...(after ? { after } : {}),
  })) as CoinSwapsResponse;

  if (response.error) {
    throw new Error("Failed to fetch coin swaps.");
  }

  return extractCoinSwaps(address, response);
}

function parseFiniteNumber(value: string | number | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getSwapUsdValue(swap: CoinSwapActivity): number | null {
  const quoteAmount = parseFiniteNumber(swap.quoteAmount);
  const quotePriceUsdc = parseFiniteNumber(swap.quotePriceUsdc);

  if (quoteAmount !== null && quotePriceUsdc !== null) {
    return quoteAmount * quotePriceUsdc;
  }

  return null;
}

/** Known Base-chain currency addresses → ticker symbols. */
const BASE_CURRENCY_SYMBOLS: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "ETH",
  "0x4200000000000000000000000000000000000006": "ETH", // WETH
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
};

function getSwapNativeAmount(swap: CoinSwapActivity): string | null {
  const quoteAmount = parseFiniteNumber(swap.quoteAmount);
  if (quoteAmount === null || quoteAmount === 0) return null;

  const currencyAddress = swap.quoteCurrencyAddress?.toLowerCase();
  const symbol = currencyAddress
    ? BASE_CURRENCY_SYMBOLS[currencyAddress] ?? null
    : null;

  if (!symbol) return null;

  // Format to reasonable precision — drop trailing zeros
  const formatted =
    quoteAmount < 0.001
      ? quoteAmount.toExponential(1)
      : quoteAmount < 1
        ? quoteAmount.toPrecision(3)
        : quoteAmount < 1000
          ? quoteAmount.toFixed(2)
          : formatCompactNumber(quoteAmount);

  return `${formatted} ${symbol}`;
}

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatActivityTrader(swap: CoinSwapActivity): string {
  const handle = swap.senderProfileHandle?.trim();
  if (handle) {
    return handle.startsWith("@") ? handle : `@${handle}`;
  }

  if (swap.senderAddress) {
    return truncateAddress(swap.senderAddress);
  }

  return "Unknown trader";
}

function toActivityAction(
  activityType: CoinSwapActivity["activityType"],
): "bought" | "sold" {
  return activityType === "SELL" ? "sold" : "bought";
}

function toTimestampValue(timestamp: string | undefined): number {
  if (!timestamp) return 0;

  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createActivityFeedItem(
  coin: CoinNode,
  swap: CoinSwapActivity | undefined,
): ActivityFeedItem | null {
  if (!swap?.blockTimestamp) {
    return null;
  }

  const notionalUsd = getSwapUsdValue(swap);
  const coinName = coin.name?.trim() || coin.symbol?.trim() || "Unknown coin";

  // Prefer USD, fall back to native currency, then "—"
  let amount: string;
  if (notionalUsd !== null) {
    amount = formatCompactCurrency(notionalUsd);
  } else {
    amount = getSwapNativeAmount(swap) ?? "\u2014";
  }

  return {
    id:
      swap.id ??
      swap.transactionHash ??
      `${coin.address ?? coinName}-${swap.blockTimestamp}`,
    trader: formatActivityTrader(swap),
    action: toActivityAction(swap.activityType),
    amount,
    coin: coinName,
    timestamp: swap.blockTimestamp,
  };
}

export async function fetchActivityFeed(
  count: number = 6,
): Promise<ActivityFeedItem[]> {
  const requestedCount = Math.max(1, count);
  // Fetch extra to compensate for deduplication and failed swaps
  const fetchCount = Math.min(requestedCount * 2, 12);
  const recentCoins = await fetchCoins("last-traded", fetchCount);
  const seenAddresses = new Set<string>();
  const uniqueCoins = recentCoins.filter((coin) => {
    const address = normalizeWalletAddress(coin.address);
    if (!address || seenAddresses.has(address)) {
      return false;
    }

    seenAddresses.add(address);
    return true;
  });

  const recentSwaps = await Promise.allSettled(
    uniqueCoins.map(async (coin) => {
      const address = normalizeWalletAddress(coin.address);
      if (!address) {
        return null;
      }

      const response = await fetchCoinSwaps(address, 1);
      return createActivityFeedItem(coin, response.swaps[0]);
    }),
  );

  const sorted = recentSwaps
    .flatMap((result) => {
      if (result.status !== "fulfilled" || !result.value) {
        return [];
      }

      return [result.value];
    })
    .sort((left, right) => toTimestampValue(right.timestamp) - toTimestampValue(left.timestamp));

  // Deduplicate visually identical entries (same trader + action + coin)
  const seenKeys = new Set<string>();
  const deduplicated: ActivityFeedItem[] = [];
  for (const item of sorted) {
    const key = `${item.trader}|${item.action}|${item.coin}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduplicated.push(item);
  }

  return deduplicated.slice(0, requestedCount);
}

export function formatCompactCurrency(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "\u2014";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "\u2014";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  if (abs === 0) return "$0";
  if (abs < 1) return `${sign}<$1`;
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
