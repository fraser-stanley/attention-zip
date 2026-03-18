"use client";

import { useQuery } from "@tanstack/react-query";
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
    refetchInterval: 300_000,
  });

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="type-label w-12">Rank</TableHead>
          <TableHead className="type-label">Address</TableHead>
          <TableHead className="type-label text-right">Volume</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data?.traders ?? []).map((trader, index) => (
          <TableRow key={trader.address ?? index}>
            <TableCell className="type-body-sm font-mono text-muted-foreground">
              #{index + 1}
            </TableCell>
            <TableCell className="type-body-sm font-mono">
              {truncateAddress(trader.address ?? "")}
            </TableCell>
            <TableCell className="type-body-sm text-right font-mono">
              {formatCompactCurrency(trader.volume)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
