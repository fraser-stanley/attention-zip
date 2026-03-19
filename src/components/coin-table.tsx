"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
import { TextMorph } from "@/components/text-morph";
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
import { cn } from "@/lib/utils";

const TICK_MS = 1600;
const REFRESH_INTERVAL_MS = 30_000;

/** Deterministic pseudo-random for stable oscillation per tick+seed. */
function pseudoRandom(tick: number, seed: number) {
  const x = Math.sin(tick * 9301 + seed * 49297) * 49979;
  return x - Math.floor(x);
}

type SimulatedCoin = {
  name: string;
  address: string;
  coinType: string | undefined;
  marketCap: string;
  volume24h: string;
  changeValue: number;
  changeText: string;
  positive: boolean | null;
};

function simulateCoins(coins: CoinNode[], tick: number): SimulatedCoin[] {
  return coins.map((coin, i) => {
    const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
    const baseChangeValue = Number.parseFloat(change.value);

    if (tick <= 0) {
      return {
        name: coin.name ?? "Unknown",
        address: coin.address ?? "",
        coinType: coin.coinType,
        marketCap: formatCompactCurrency(coin.marketCap),
        volume24h: formatCompactCurrency(coin.volume24h),
        changeValue: Number.isFinite(baseChangeValue) ? baseChangeValue : 0,
        changeText: change.value,
        positive: change.positive,
      };
    }

    const mcapNum = typeof coin.marketCap === "string" ? Number.parseFloat(coin.marketCap) : (coin.marketCap ?? 0);
    const volNum = typeof coin.volume24h === "string" ? Number.parseFloat(coin.volume24h) : (coin.volume24h ?? 0);
    const drift = (pseudoRandom(tick, i) - 0.45) * 0.012;

    const simMcap = Math.max(1, (Number.isFinite(mcapNum) ? mcapNum : 0) * (1 + drift));
    const simVol = Math.max(1, (Number.isFinite(volNum) ? volNum : 0) * (1 - drift * 1.25));
    const simChange = Number.isFinite(baseChangeValue) ? baseChangeValue + drift * 100 : 0;

    return {
      name: coin.name ?? "Unknown",
      address: coin.address ?? "",
      coinType: coin.coinType,
      marketCap: formatCompactCurrency(simMcap),
      volume24h: formatCompactCurrency(simVol),
      changeValue: simChange,
      changeText: `${simChange >= 0 ? "+" : ""}${simChange.toFixed(1)}%`,
      positive: simChange > 0 ? true : simChange < 0 ? false : null,
    };
  });
}

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
  const reduceMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);

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
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const coins = useMemo(() => data?.coins ?? [], [data]);
  const simulated = useMemo(() => simulateCoins(coins, tick), [coins, tick]);

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

  if (coins.length === 0) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        No coins found.
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="type-label w-10">#</TableHead>
          <TableHead className="type-label w-[20%]">Name</TableHead>
          {!compact && <TableHead className="type-label w-[16%]">Address</TableHead>}
          <TableHead className="type-label w-[12%]">Type</TableHead>
          <TableHead className="type-label w-[16%] text-right">Market Cap</TableHead>
          <TableHead className="type-label w-[14%] text-right">24h Vol</TableHead>
          <TableHead className="type-label w-[14%] text-right">24h Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {simulated.map((coin, i) => (
          <TableRow key={coin.address || i} className="transition-colors hover:bg-muted/35">
            <TableCell className="type-caption font-mono text-muted-foreground">
              {i + 1}
            </TableCell>
            <TableCell className="type-body-sm font-medium truncate">
              {coin.name}
            </TableCell>
            {!compact && (
              <TableCell className="type-caption font-mono text-muted-foreground">
                {truncateAddress(coin.address)}
              </TableCell>
            )}
            <TableCell>
              <Badge variant="secondary" className="type-caption font-normal">
                {coinTypeLabel(coin.coinType)}
              </Badge>
            </TableCell>
            <TableCell className="type-body-sm text-right font-mono">
              <TextMorph>{coin.marketCap}</TextMorph>
            </TableCell>
            <TableCell className="type-body-sm text-right font-mono">
              <TextMorph>{coin.volume24h}</TextMorph>
            </TableCell>
            <TableCell className="type-body-sm text-right font-mono">
              {coin.positive !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 font-medium",
                    coin.positive ? "bg-[#3FFF00] text-black" : "bg-[#FF00F0] text-black"
                  )}
                >
                  <TextMorph>{coin.changeText}</TextMorph>
                </span>
              ) : (
                <span className="text-muted-foreground"><TextMorph>{coin.changeText}</TextMorph></span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
