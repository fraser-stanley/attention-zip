"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactCurrency, truncateAddress } from "@/lib/zora";

export default function LeaderboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", 20],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard?count=20");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ traders: Record<string, unknown>[] }>;
    },
    refetchInterval: 300_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Top Zora traders this week. Data from Zora&apos;s weekly trader
          leaderboard.
        </p>
      </div>

      {error ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Failed to load leaderboard. Try refreshing.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.traders ?? []).map((trader, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  #{i + 1}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {truncateAddress((trader.address as string) ?? "")}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCompactCurrency(trader.volume as string)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
