"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatCompactCurrency } from "@/lib/zora";
import { pnlColor, formatPnl, formatPct } from "@/lib/pnl-utils";
import { skills } from "@/lib/skills";
import { MOCK_PORTFOLIO, type MockPosition } from "@/lib/portfolio-mock-data";

type PositionFilter = "active" | "resolved" | "all";

const activeCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "active").length;
const resolvedCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "resolved").length;
const allCount = MOCK_PORTFOLIO.positions.length;

/* ─── Simmer-style 2×2 stats grid ─── */
function PnlStats() {
  const { pnl } = MOCK_PORTFOLIO;

  return (
    <div className="grid grid-cols-2 gap-px">
      {/* Profit / Loss */}
      <div className="p-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Profit / Loss
        </p>
        <p className="text-5xl font-bold font-display">
          <span className="highlight-block">{formatPnl(pnl.totalPnl)}</span>
          <span className="ml-1.5 text-sm font-normal font-mono text-muted-foreground">USDC</span>
        </p>
        <p className={`text-xs font-mono ${pnlColor(pnl.totalPnlPct)}`}>
          {formatPct(pnl.totalPnlPct)} ROI
        </p>
      </div>

      {/* Trades */}
      <div className="p-4 border-l border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Trades
        </p>
        <p className="text-5xl font-bold font-display">
          {pnl.totalTrades}
        </p>
      </div>

      {/* Win Rate */}
      <div className="p-4 border-t border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Win Rate
        </p>
        <p className="text-5xl font-bold font-display">
          {pnl.winRate}%
        </p>
      </div>

      {/* W / L */}
      <div className="p-4 border-t border-l border-border">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          W / L
        </p>
        <p className="text-5xl font-bold font-display">
          {pnl.wins} / {pnl.losses}
        </p>
      </div>
    </div>
  );
}



/* ─── Positions tab content ─── */
function PositionsContent() {
  const [filter, setFilter] = useState<PositionFilter>("active");

  const positions = MOCK_PORTFOLIO.positions.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <p className="font-display text-5xl tracking-tight py-6">
        {activeCount} positions open, {formatCompactCurrency(MOCK_PORTFOLIO.totalValue)} total value
      </p>

      {/* Filter pills */}
      <div className="flex items-center gap-1">
        {([
          { value: "active" as const, count: activeCount },
          { value: "resolved" as const, count: resolvedCount },
          { value: "all" as const, count: allCount },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm transition-colors border border-transparent ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-muted text-foreground/50 hover:text-foreground hover:bg-foreground/10"
            }`}
          >
            {f.value.charAt(0).toUpperCase() + f.value.slice(1)}{" "}
            <span className="opacity-50">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {positions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No {filter} positions.
        </p>
      ) : (
        <PositionRows positions={positions} />
      )}
    </div>
  );
}

function PositionRows({ positions }: { positions: MockPosition[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs font-mono uppercase tracking-wider">Market</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider">Avg</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider">Current</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((pos) => {
          const avgPrice = pos.entryPrice / pos.quantity;
          const currentUnitPrice = pos.currentPrice / pos.quantity;

          return (
            <TableRow key={pos.address}>
              <TableCell>
                <div>
                  <span className="text-sm font-medium">{pos.coin}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    ${pos.symbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {pos.quantity.toLocaleString()} tokens at ${avgPrice.toFixed(4)}
                </p>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                ${avgPrice.toFixed(4)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                ${currentUnitPrice.toFixed(4)}
              </TableCell>
              <TableCell className="text-right">
                <p className={`font-mono text-sm font-medium ${pnlColor(pos.pnl)}`}>
                  {formatCompactCurrency(pos.currentPrice)}
                </p>
                <p className={`text-xs font-mono ${pnlColor(pos.pnl)}`}>
                  {formatPnl(pos.pnl)} {formatPct(pos.pnlPct)}
                </p>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ─── History tab (recent trades) ─── */
function HistoryContent() {
  const trades = MOCK_PORTFOLIO.recentTrades;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs font-mono uppercase tracking-wider">Coin</TableHead>
          <TableHead className="text-xs font-mono uppercase tracking-wider">Side</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider">Amount</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider">PnL</TableHead>
          <TableHead className="text-right text-xs font-mono uppercase tracking-wider hidden sm:table-cell">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
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
  );
}

/* ─── Skills section ─── */
function InstalledSkills() {
  const installed = skills.filter((s) =>
    MOCK_PORTFOLIO.installedSkillIds.includes(s.id)
  );
  const available = skills.filter(
    (s) => !MOCK_PORTFOLIO.installedSkillIds.includes(s.id)
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold font-sans uppercase tracking-wider">
        Agent Loadout
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {installed.map((skill) => (
          <Card key={skill.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-sans font-medium">{skill.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {skill.description}
                  </p>
                </div>
                <Badge className="shrink-0 bg-[#3FFF00] text-black border-transparent">
                  Equipped
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {available.map((skill) => (
          <Card key={skill.id} className="border-dashed opacity-60 hover:opacity-100 transition-opacity">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-sans font-medium">{skill.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {skill.description}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Equip
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        href="/skills"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Browse all skills
      </Link>
    </div>
  );
}

/* ─── Main export ─── */
export function PortfolioView() {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <PnlStats />

      {/* Market section */}
      <div className="space-y-4">


        <Tabs defaultValue="positions">
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <PositionsContent />
          </TabsContent>

          <TabsContent value="orders">
            <p className="py-8 text-center text-sm text-muted-foreground">
              No open orders.
            </p>
          </TabsContent>

          <TabsContent value="history">
            <HistoryContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Skills */}
      <InstalledSkills />
    </div>
  );
}
