"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  formatCompactCurrency,
  formatChange,
  truncateAddress,
  coinTypeLabel,
} from "@/lib/zora";

export default function CoinPage() {
  const params = useParams();
  const address = params.address as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["coin", address],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${address}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{
        coin: Record<string, unknown>;
        swaps: Record<string, unknown>[];
        holders: Record<string, unknown>[];
      }>;
    },
    enabled: !!address,
  });

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Coin not found or failed to load.</p>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const coin = data?.coin ?? {};
  const swaps = data?.swaps ?? [];
  const holders = data?.holders ?? [];
  const change = formatChange(
    coin.marketCap as string,
    coin.marketCapDelta24h as string
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {(coin.name as string) ?? "Unknown Coin"}
          </h1>
          {typeof coin.symbol === "string" && (
            <Badge variant="secondary" className="text-xs">
              {coin.symbol}
            </Badge>
          )}
          {typeof coin.coinType === "string" && (
            <Badge variant="outline" className="text-xs">
              {coinTypeLabel(coin.coinType)}
            </Badge>
          )}
        </div>
        <p className="font-mono text-sm text-muted-foreground">{address}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">
              {formatCompactCurrency(coin.marketCap as string)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              24h Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">
              {formatCompactCurrency(coin.volume24h as string)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              24h Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg font-semibold font-mono ${
                change.positive === true
                  ? "text-green-600 dark:text-green-400"
                  : change.positive === false
                  ? "text-red-600 dark:text-red-400"
                  : ""
              }`}
            >
              {change.value}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              Holders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">
              {(coin.uniqueHolders as number)?.toLocaleString() ?? "\u2014"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Monitor this coin</p>
            <p className="text-xs text-muted-foreground">
              Install Trend Scout to get alerts when this coin moves.
            </p>
          </div>
          <Link href="/skills#trend-scout" className={buttonVariants({ size: "sm" })}>
            Install Trend Scout
          </Link>
        </CardContent>
      </Card>

      <Separator />

      {/* Recent swaps */}
      {swaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Swaps</h2>
          <div className="space-y-1">
            {swaps.slice(0, 10).map((swap, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-accent/50"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {truncateAddress((swap.account as string) ?? "")}
                </span>
                <span
                  className={`font-mono text-xs ${
                    swap.isBuy
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {swap.isBuy ? "Buy" : "Sell"}
                </span>
                <span className="font-mono text-xs">
                  {formatCompactCurrency(swap.amountUsd as string)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top holders */}
      {holders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Top Holders</h2>
          <div className="space-y-1">
            {holders.slice(0, 10).map((holder, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-accent/50"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {truncateAddress((holder.address as string) ?? "")}
                </span>
                <span className="font-mono text-xs">
                  {formatCompactCurrency(holder.balance as string)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
