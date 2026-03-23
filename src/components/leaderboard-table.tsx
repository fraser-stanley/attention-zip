"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
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

const TICK_MS = 1600;
const REFRESH_INTERVAL_MS = 300_000;

/** Deterministic pseudo-random for stable oscillation per tick+seed. */
function pseudoRandom(tick: number, seed: number) {
  const x = Math.sin(tick * 9301 + seed * 49297) * 49979;
  return x - Math.floor(x);
}

type SimulatedTrader = {
  address: string;
  displayName?: string;
  volume: string;
};

function simulateTraders(traders: TraderNode[], tick: number): SimulatedTrader[] {
  return traders.map((trader, i) => {
    const volNum = typeof trader.volume === "string" ? Number.parseFloat(trader.volume) : (trader.volume ?? 0);
    const baseVol = Number.isFinite(volNum) ? volNum : 0;

    if (tick <= 0) {
      return {
        address: trader.address ?? "",
        displayName: trader.displayName,
        volume: formatCompactCurrency(trader.volume),
      };
    }

    const drift = (pseudoRandom(tick, i) - 0.45) * 0.012;
    const simVol = Math.max(1, baseVol * (1 + drift));

    return {
      address: trader.address ?? "",
      displayName: trader.displayName,
      volume: formatCompactCurrency(simVol),
    };
  });
}

export function LeaderboardTable({
  initialTraders,
  count = 20,
}: {
  initialTraders: TraderNode[];
  count?: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);

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

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const traders = useMemo(() => data?.traders ?? [], [data]);
  const simulated = useMemo(() => simulateTraders(traders, tick), [traders, tick]);

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
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="type-label w-16">Rank</TableHead>
          <TableHead className="type-label">Address</TableHead>
          <TableHead className="type-label w-[30%] text-right">Volume</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {simulated.map((trader, index) => (
          <TableRow key={trader.address || index} className="transition-colors hover:bg-muted/35">
            <TableCell className="type-body-sm font-mono text-muted-foreground">
              #{index + 1}
            </TableCell>
            <TableCell className="type-body-sm font-mono">
              {trader.displayName ? `$${trader.displayName}` : truncateAddress(trader.address)}
            </TableCell>
            <TableCell className="type-body-sm text-right font-mono">
              <TextMorph>{trader.volume}</TextMorph>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
