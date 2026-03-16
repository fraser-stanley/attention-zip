"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PnlSparkline } from "@/components/pnl-sparkline";
import {
  formatCompactCurrency,
  formatChange,
  truncateAddress,
  coinTypeLabel,
  type AgentProfileApiResponse,
} from "@/lib/zora";
import { pnlColor, formatPnl, formatPct } from "@/lib/pnl-utils";
import {
  AGENT_MOCK_PNL,
  AGENT_MOCK_POSITIONS,
  AGENT_MOCK_TRADES,
  AGENT_MOCK_SPARKLINE,
} from "@/lib/agent-mock-data";
import type { MockPosition } from "@/lib/portfolio-mock-data";

type PositionFilter = "active" | "resolved" | "all";

function StatsRow() {
  const pnl = AGENT_MOCK_PNL;

  const stats = [
    { label: "Total PnL", value: formatPnl(pnl.totalPnl), sub: formatPct(pnl.totalPnlPct), color: pnlColor(pnl.totalPnl) },
    { label: "Realized", value: formatPnl(pnl.realizedPnl), color: pnlColor(pnl.realizedPnl) },
    { label: "Unrealized", value: formatPnl(pnl.unrealizedPnl), color: pnlColor(pnl.unrealizedPnl) },
    { label: "Trades", value: String(pnl.totalTrades), color: "" },
    { label: "Win rate", value: `${pnl.winRate}%`, color: "" },
    { label: "W / L", value: `${pnl.wins} / ${pnl.losses}`, color: "" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="border border-border p-3">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className={`font-mono text-sm font-medium ${stat.color}`}>
            {stat.value}
            {stat.sub && (
              <span className="ml-1 text-xs">{stat.sub}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

function PositionsTable() {
  const [filter, setFilter] = useState<PositionFilter>("active");

  const positions = AGENT_MOCK_POSITIONS.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Positions</h2>
        <span className="text-xs font-mono text-muted-foreground">
          {AGENT_MOCK_POSITIONS.filter((p) => p.status === "active").length} active
          {" \u00b7 "}
          {AGENT_MOCK_POSITIONS.filter((p) => p.status === "resolved").length} resolved
        </span>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as PositionFilter)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {positions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No {filter} positions.
            </p>
          ) : (
            <PositionRows positions={positions} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PositionRows({ positions }: { positions: MockPosition[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coin</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="text-right">Entry</TableHead>
          <TableHead className="text-right">Current</TableHead>
          <TableHead className="text-right">PnL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((pos) => (
          <TableRow key={pos.address}>
            <TableCell>
              <span className="text-sm font-medium">{pos.coin}</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                ${pos.symbol}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant="outline">{coinTypeLabel(pos.coinType)}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant={pos.status === "active" ? "default" : "outline"}>
                {pos.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatCompactCurrency(pos.entryPrice)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatCompactCurrency(pos.currentPrice)}
            </TableCell>
            <TableCell className={`text-right font-mono text-sm ${pnlColor(pos.pnl)}`}>
              {formatPnl(pos.pnl)}
              <span className="ml-1 text-xs">{formatPct(pos.pnlPct)}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RecentTrades() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Recent trades</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coin</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">PnL</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {AGENT_MOCK_TRADES.map((trade) => (
            <TableRow key={`${trade.coin}-${trade.date}`}>
              <TableCell className="font-mono text-sm">${trade.coin}</TableCell>
              <TableCell>
                <Badge variant={trade.side === "buy" ? "default" : "outline"}>
                  {trade.side}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                ${trade.amount.toLocaleString()}
              </TableCell>
              <TableCell className={`text-right font-mono text-sm ${pnlColor(trade.pnl)}`}>
                {formatPnl(trade.pnl)}
                <span className="ml-1 text-xs">{formatPct(trade.pct)}</span>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                {trade.date}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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

      {/* Header */}
      <div className="flex items-center gap-3">
        {profile.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt=""
            className="h-10 w-10 rounded-full"
          />
        )}
        <div>
          <h1 className="font-mono text-lg font-medium">
            {profile.handle || truncateAddress(address)}
          </h1>
          <p className="font-mono text-xs text-muted-foreground break-all">
            {address}
          </p>
        </div>
      </div>

      {/* Stats + Sparkline */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <StatsRow />
        <div className="border border-border p-3 h-[140px]">
          <p className="text-xs text-muted-foreground mb-1">Cumulative PnL</p>
          <PnlSparkline data={AGENT_MOCK_SPARKLINE} height={100} />
        </div>
      </div>

      {/* Positions */}
      <PositionsTable />

      {/* Recent trades */}
      <RecentTrades />

      {/* Holdings from API */}
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
    </div>
  );
}
