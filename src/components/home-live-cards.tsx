"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CoinNode,
  ExploreApiResponse,
  LeaderboardApiResponse,
  TraderNode,
} from "@/lib/zora";
import { formatCompactCurrency, formatChange, truncateAddress } from "@/lib/zora";

type HomeCardSort = "trending" | "gainers" | "volume";

function CoinCard({
  title,
  sort,
  initialCoins,
}: {
  title: string;
  sort: HomeCardSort;
  initialCoins?: CoinNode[];
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["explore", sort, 3],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=${sort}&count=3`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins
      ? {
          coins: initialCoins,
          sort,
          count: 3,
        }
      : undefined,
    initialDataUpdatedAt: initialCoins ? Date.now() : undefined,
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        ) : (
          (data?.coins ?? []).map((coin, i) => {
            const change = formatChange(
              coin.marketCap,
              coin.marketCapDelta24h
            );
            return (
              <div
                key={coin.address ?? i}
                className="flex items-center justify-between text-sm px-1 -mx-1 py-0.5"
              >
                <span className="truncate font-medium">
                  {coin.name ?? "Unknown"}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">
                    {formatCompactCurrency(coin.marketCap)}
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      change.positive === true
                        ? "text-green-600 dark:text-green-400"
                        : change.positive === false
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {change.value}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({ initialTraders }: { initialTraders?: TraderNode[] }) {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", 3],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?count=3");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<LeaderboardApiResponse>;
    },
    initialData: initialTraders
      ? {
          traders: initialTraders,
          count: 3,
        }
      : undefined,
    initialDataUpdatedAt: initialTraders ? Date.now() : undefined,
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Top Traders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        ) : (
          (data?.traders ?? []).map((trader, i) => (
            <div
              key={trader.address ?? i}
              className="flex items-center justify-between text-sm px-1 -mx-1 py-0.5"
            >
              <span className="truncate font-mono text-xs">
                {truncateAddress(trader.address ?? "")}
              </span>
              <span className="text-muted-foreground shrink-0">
                {formatCompactCurrency(trader.volume)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function HomeLiveCards({
  initialCoins,
  initialTraders,
}: {
  initialCoins?: Partial<Record<HomeCardSort, CoinNode[]>>;
  initialTraders?: TraderNode[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CoinCard
        title="Trending Now"
        sort="trending"
        initialCoins={initialCoins?.trending}
      />
      <CoinCard
        title="Top Gainers (24h)"
        sort="gainers"
        initialCoins={initialCoins?.gainers}
      />
      <CoinCard
        title="Volume Leaders"
        sort="volume"
        initialCoins={initialCoins?.volume}
      />
      <LeaderboardCard initialTraders={initialTraders} />
    </div>
  );
}
