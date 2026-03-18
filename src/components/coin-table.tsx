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
import { Badge } from "@/components/ui/badge";
import type { CoinNode, ExploreApiResponse, SortOption } from "@/lib/zora";
import {
  formatCompactCurrency,
  formatChange,
  truncateAddress,
  coinTypeLabel,
} from "@/lib/zora";

interface CoinTableProps {
  sort: SortOption;
  count?: number;
  compact?: boolean;
  initialCoins?: CoinNode[];
}

export function CoinTable({
  sort,
  count = 10,
  compact = false,
  initialCoins,
}: CoinTableProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["explore", sort, count],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=${sort}&count=${count}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins
      ? {
          coins: initialCoins,
          sort,
          count,
        }
      : undefined,
    initialDataUpdatedAt: undefined,
  });

  if (error) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        Failed to load data. Try refreshing.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: compact ? 5 : count }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const coins = data?.coins ?? [];

  if (coins.length === 0) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        No coins found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="type-label w-10">#</TableHead>
          <TableHead className="type-label">Name</TableHead>
          {!compact && <TableHead className="type-label">Address</TableHead>}
          <TableHead className="type-label">Type</TableHead>
          <TableHead className="type-label text-right">Market Cap</TableHead>
          <TableHead className="type-label text-right">24h Vol</TableHead>
          <TableHead className="type-label text-right">24h Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coins.map((coin, i) => {
          const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
          return (
            <TableRow key={coin.address ?? i}>
              <TableCell className="type-caption font-mono text-muted-foreground">
                {i + 1}
              </TableCell>
              <TableCell>
                {coin.name ?? "Unknown"}
              </TableCell>
              {!compact && (
                <TableCell className="type-caption font-mono text-muted-foreground">
                  {truncateAddress(coin.address ?? "")}
                </TableCell>
              )}
              <TableCell>
                <Badge variant="secondary" className="type-caption font-normal">
                  {coinTypeLabel(coin.coinType)}
                </Badge>
              </TableCell>
              <TableCell className="type-body-sm text-right font-mono">
                {formatCompactCurrency(coin.marketCap)}
              </TableCell>
              <TableCell className="type-body-sm text-right font-mono">
                {formatCompactCurrency(coin.volume24h)}
              </TableCell>
              <TableCell
                className={`type-body-sm text-right font-mono ${
                  change.positive === true
                    ? "text-[#3FFF00]"
                    : change.positive === false
                    ? "text-[#FF00F0]"
                    : "text-muted-foreground"
                }`}
              >
                {change.value}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
