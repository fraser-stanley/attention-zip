"use client";

import Link from "next/link";
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
    initialDataUpdatedAt: Date.now(),
    refetchInterval: 300_000,
  });

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
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
          <TableHead className="w-12">Rank</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Volume</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data?.traders ?? []).map((trader, index) => (
          <TableRow key={trader.address ?? index}>
            <TableCell className="font-mono text-sm text-muted-foreground">
              #{index + 1}
            </TableCell>
            <TableCell className="font-mono text-sm">
              <Link
                href={`/agents/${trader.address}`}
                className="hover:underline min-h-[44px] inline-flex items-center"
              >
                {truncateAddress(trader.address ?? "")}
              </Link>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatCompactCurrency(trader.volume)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
