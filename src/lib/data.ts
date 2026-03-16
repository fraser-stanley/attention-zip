import { unstable_cache } from "next/cache";
import { MOCK_COINS, MOCK_TRADERS, MOCK_DEFAULT_PROFILE } from "@/lib/mock-data";
import {
  fetchCoins,
  fetchLeaderboard,
  fetchProfileBalanceNodes,
  fetchProfileCoinNodes,
  type CoinNode,
  type SortOption,
  type TraderNode,
  type ProfileData,
  type AgentProfileApiResponse,
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

const AGENT_PROFILE_REVALIDATE_SECONDS = 120;

const cachedAgentProfileFetchers = new Map<
  string,
  () => Promise<AgentProfileApiResponse>
>();

function getAgentProfileFetcher(address: string) {
  let fetcher = cachedAgentProfileFetchers.get(address);
  if (!fetcher) {
    fetcher = unstable_cache(
      async (): Promise<AgentProfileApiResponse> => {
        try {
          const [balanceResult, coins, traders] = await Promise.all([
            fetchProfileBalanceNodes(address, 20),
            fetchProfileCoinNodes(address, 20),
            fetchLeaderboard(50),
          ]);

          const balances = balanceResult.balances;
          const totalValueUsd = balances.reduce((sum, b) => {
            const price = parseFloat(b.coin?.tokenPrice?.priceInUsdc ?? "0");
            const bal = parseFloat(b.balance ?? "0");
            // balance is in wei (18 decimals)
            return sum + (price * bal) / 1e18;
          }, 0);

          const traderIndex = traders.findIndex(
            (t) => t.address?.toLowerCase() === address.toLowerCase()
          );

          const profile: ProfileData = {
            handle: balanceResult.handle,
            avatar: balanceResult.avatar,
            balances,
            balanceCount: balanceResult.totalCount,
            coins,
            coinCount: coins.length,
            totalValueUsd,
          };

          return {
            address,
            volume: traderIndex >= 0 ? traders[traderIndex].volume : undefined,
            leaderboardRank: traderIndex >= 0 ? traderIndex + 1 : undefined,
            profile,
          };
        } catch {
          return {
            address,
            profile: MOCK_DEFAULT_PROFILE,
          };
        }
      },
      ["agent-profile", address.toLowerCase()],
      { revalidate: AGENT_PROFILE_REVALIDATE_SECONDS }
    );
    cachedAgentProfileFetchers.set(address, fetcher);
  }
  return fetcher;
}

export async function getAgentProfileData(
  address: string
): Promise<AgentProfileApiResponse> {
  return getAgentProfileFetcher(address)();
}
