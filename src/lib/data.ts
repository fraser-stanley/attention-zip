import { unstable_cache } from "next/cache";
import { MOCK_COINS, MOCK_TRADERS } from "@/lib/mock-data";
import {
  fetchCoins,
  fetchLeaderboard,
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
  featured: 60,
};

const LEADERBOARD_REVALIDATE_SECONDS = 300;

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
        const coins = await fetchCoins(sort, count);
        return coins.length > 0 ? coins : MOCK_COINS.slice(0, count);
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
        const traders = await fetchLeaderboard(count);
        return traders.length > 0 ? traders : MOCK_TRADERS.slice(0, count);
      },
      ["leaderboard-data", String(count)],
      { revalidate: LEADERBOARD_REVALIDATE_SECONDS }
    );
    cachedLeaderboardFetchers.set(count, fetcher);
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
