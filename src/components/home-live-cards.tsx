"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { CoinNode } from "@/lib/zora";
import {
  formatCompactCurrency,
  formatChange,
  truncateAddress,
} from "@/lib/zora";

function CoinCard({
  title,
  sort,
}: {
  title: string;
  sort: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["explore", sort, 3],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=${sort}&count=3`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ coins: CoinNode[] }>;
    },
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
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
              <Link
                key={coin.address ?? i}
                href={`/coin/${coin.address}`}
                className="flex items-center justify-between text-sm hover:bg-accent/50 rounded px-1 -mx-1 py-0.5"
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
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function LeaderboardCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", 3],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?count=3");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ traders: Record<string, unknown>[] }>;
    },
    refetchInterval: 300_000,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top Traders This Week
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
              key={i}
              className="flex items-center justify-between text-sm py-0.5"
            >
              <span className="font-mono text-xs text-muted-foreground">
                #{i + 1}{" "}
                {truncateAddress((trader.address as string) ?? "")}
              </span>
              <span className="text-muted-foreground">
                {formatCompactCurrency(trader.volume as string)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function HomeLiveCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CoinCard title="Trending Now" sort="trending" />
      <CoinCard title="Top Gainers (24h)" sort="gainers" />
      <CoinCard title="Volume Leaders" sort="volume" />
      <LeaderboardCard />
    </div>
  );
}
