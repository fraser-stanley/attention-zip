"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  formatChange,
  truncateAddress,
  coinTypeLabel,
  type AgentProfileApiResponse,
} from "@/lib/zora";

export function AgentProfileDetail({
  address,
  initialProfile,
}: {
  address: string;
  initialProfile: AgentProfileApiResponse;
}) {
  const { data } = useQuery({
    queryKey: ["agent-profile", address],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${address}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<AgentProfileApiResponse>;
    },
    initialData: initialProfile,
    initialDataUpdatedAt: Date.now(),
    refetchInterval: 120_000,
  });

  const profile = data?.profile;

  if (!profile) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No profile data available.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/agents"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to agents
      </Link>

      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {profile.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="font-mono text-lg">
              {profile.handle || truncateAddress(address)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Portfolio value
              </p>
              <p className="text-xl font-bold font-mono">
                {formatCompactCurrency(profile.totalValueUsd)}
              </p>
            </div>
            {data.volume && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Volume
                </p>
                <p className="text-xl font-bold font-mono">
                  {formatCompactCurrency(data.volume)}
                </p>
              </div>
            )}
            {data.leaderboardRank && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Rank
                </p>
                <p className="text-xl font-bold font-mono">
                  #{data.leaderboardRank}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Holdings
              </p>
              <p className="text-xl font-bold font-mono">
                {profile.balanceCount}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              PnL breakdown requires trade history indexing — coming soon
            </p>
          </div>
          <p className="mt-2 text-xs font-mono text-muted-foreground break-all">
            {address}
          </p>
        </CardContent>
      </Card>

      {/* Holdings table */}
      {profile.balances.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Holdings</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">24h</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.balances.map((balance, index) => {
                const coin = balance.coin;
                if (!coin) return null;
                const change = formatChange(
                  coin.marketCap,
                  coin.marketCapDelta24h
                );
                return (
                  <TableRow key={coin.address ?? index}>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">
                          {coin.name}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          ${coin.symbol}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {coinTypeLabel(coin.coinType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCompactCurrency(coin.marketCap)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
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
        </div>
      )}

      {/* Created coins */}
      {profile.coins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Created coins
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">24h Vol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.coins.map((coin, index) => (
                <TableRow key={coin.address ?? index}>
                  <TableCell>
                    <div>
                      <span className="text-sm font-medium">{coin.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        ${coin.symbol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">
                      {coinTypeLabel(coin.coinType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCompactCurrency(coin.marketCap)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCompactCurrency(coin.volume24h)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {profile.balances.length === 0 && profile.coins.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No holdings or created coins found for this address.
        </div>
      )}
    </div>
  );
}
