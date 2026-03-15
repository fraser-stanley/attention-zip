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

export async function getExploreData(
  sort: SortOption,
  count: number = 10
): Promise<CoinNode[]> {
  const read = unstable_cache(
    async () => {
      const coins = await fetchCoins(sort, count);
      return coins.length > 0 ? coins : MOCK_COINS.slice(0, count);
    },
    ["explore-data", sort, String(count)],
    { revalidate: EXPLORE_REVALIDATE_SECONDS[sort] }
  );

  return read();
}

export async function getLeaderboardData(
  count: number = 20
): Promise<TraderNode[]> {
  const read = unstable_cache(
    async () => {
      const traders = await fetchLeaderboard(count);
      return traders.length > 0 ? traders : MOCK_TRADERS.slice(0, count);
    },
    ["leaderboard-data", String(count)],
    { revalidate: LEADERBOARD_REVALIDATE_SECONDS }
  );

  return read();
}
