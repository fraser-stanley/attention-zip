"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TextMorph } from "@/components/text-morph";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCompactCurrency,
  truncateAddress,
  type LeaderboardApiResponse,
  type TraderNode,
} from "@/lib/zora";

const REFRESH_INTERVAL_MS = 300_000;

export function LeaderboardTable({
  initialTraders,
  count = 20,
}: {
  initialTraders: TraderNode[];
  count?: number;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", count],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?count=${count}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<LeaderboardApiResponse>;
    },
    initialData: {
      traders: initialTraders,
      count,
    },
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const traders = data?.traders ?? [];

  if (error) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        Failed to load leaderboard. Try refreshing.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        No live leaderboard data yet.
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="type-label w-16">Rank</TableHead>
          <TableHead className="type-label">Trader</TableHead>
          <TableHead className="type-label w-[24%] text-right">7d Volume</TableHead>
          <TableHead className="type-label w-24 text-right">Trades</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {traders.map((trader, index) => {
          const label =
            trader.displayName ??
            (trader.address ? truncateAddress(trader.address) : "Unknown trader");

          return (
            <TableRow
              key={trader.address ?? trader.profileId ?? trader.displayName ?? index}
              className="transition-colors hover:bg-muted/35"
            >
              <TableCell className="type-body-sm font-mono text-muted-foreground">
                #{index + 1}
              </TableCell>
              <TableCell className="type-body-sm font-mono">
                {trader.address ? (
                  <Link
                    href={`/portfolio/${trader.address}`}
                    className="hover:text-foreground/70"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </TableCell>
              <TableCell className="type-body-sm text-right font-mono">
                <TextMorph>{formatCompactCurrency(trader.volume)}</TextMorph>
              </TableCell>
              <TableCell className="type-body-sm text-right font-mono text-muted-foreground">
                {trader.tradesCount ?? "\u2014"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
