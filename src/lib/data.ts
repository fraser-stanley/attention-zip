import { unstable_cache } from "next/cache";
import { MOCK_COINS, MOCK_TRADERS } from "@/lib/mock-data";
import {
  fetchActivityFeed,
  fetchCoins,
  fetchLeaderboard,
  type ActivityFeedItem,
  type CoinNode,
  type SortOption,
  type TraderNode,
} from "@/lib/zora";

const EXPLORE_REVALIDATE_SECONDS: Record<SortOption, number> = {
  trending: 30,
  mcap: 60,
  new: 30,
  volume: 60,
  gainers: 30,
  creators: 60,
  trends: 30,
  featured: 60,
  "last-traded": 30,
  "last-traded-unique": 30,
};

const LEADERBOARD_REVALIDATE_SECONDS = 300;
const ACTIVITY_REVALIDATE_SECONDS = 30;
const ALLOW_MOCK_MARKET_DATA =
  process.env.ALLOW_MOCK_MARKET_DATA === "true" ||
  process.env.NODE_ENV !== "production";

// Cache wrappers hoisted to module scope so Next.js can reuse them across requests.

const cachedExploreFetchers = new Map<
  string,
  () => Promise<CoinNode[]>
>();

function getExploreFetcher(sort: SortOption, count: number) {
  const key = `${sort}:${count}`;
  let fetcher = cachedExploreFetchers.get(key);
  if (!fetcher) {
    fetcher = unstable_cache(
      async () => {
        try {
          const coins = await fetchCoins(sort, count);
          if (coins.length > 0) {
            return coins;
          }
        } catch {
          // Empty-state UI is safer than silently shipping fabricated market data.
        }

        return ALLOW_MOCK_MARKET_DATA ? MOCK_COINS.slice(0, count) : [];
      },
      ["explore-data", sort, String(count)],
      { revalidate: EXPLORE_REVALIDATE_SECONDS[sort] }
    );
    cachedExploreFetchers.set(key, fetcher);
  }
  return fetcher;
}

const cachedLeaderboardFetchers = new Map<
  number,
  () => Promise<TraderNode[]>
>();

function getLeaderboardFetcher(count: number) {
  let fetcher = cachedLeaderboardFetchers.get(count);
  if (!fetcher) {
    fetcher = unstable_cache(
      async () => {
        try {
          const traders = await fetchLeaderboard(count);
          if (traders.length > 0) {
            return traders;
          }
        } catch {
          // Empty-state UI is safer than silently shipping fabricated market data.
        }

        return ALLOW_MOCK_MARKET_DATA ? MOCK_TRADERS.slice(0, count) : [];
      },
      ["leaderboard-data", String(count)],
      { revalidate: LEADERBOARD_REVALIDATE_SECONDS }
    );
    cachedLeaderboardFetchers.set(count, fetcher);
  }
  return fetcher;
}

const cachedActivityFeedFetchers = new Map<
  number,
  () => Promise<ActivityFeedItem[]>
>();

function getActivityFeedFetcher(count: number) {
  let fetcher = cachedActivityFeedFetchers.get(count);
  if (!fetcher) {
    fetcher = unstable_cache(
      async () => {
        try {
          return await fetchActivityFeed(count);
        } catch {
          return [];
        }
      },
      ["activity-feed", String(count)],
      { revalidate: ACTIVITY_REVALIDATE_SECONDS }
    );
    cachedActivityFeedFetchers.set(count, fetcher);
  }

  return fetcher;
}

export async function getExploreData(
  sort: SortOption,
  count: number = 10
): Promise<CoinNode[]> {
  return getExploreFetcher(sort, count)();
}

export async function getLeaderboardData(
  count: number = 20
): Promise<TraderNode[]> {
  return getLeaderboardFetcher(count)();
}

export async function getActivityFeedData(
  count: number = 6
): Promise<ActivityFeedItem[]> {
  return getActivityFeedFetcher(count)();
}
