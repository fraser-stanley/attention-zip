"use client";

import { useState } from "react";
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
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { ClockIcon } from "@/components/ui/clock";
import { CheckIcon } from "@/components/ui/check";
import { PlusIcon } from "@/components/ui/plus";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { useToast } from "@/components/toast";

type PositionFilter = "active" | "resolved" | "all";

const activeCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "active").length;
const resolvedCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "resolved").length;
const allCount = MOCK_PORTFOLIO.positions.length;

function pnlHighlightClass(value: number) {
  return value >= 0 ? "bg-[#3FFF00] text-black" : "bg-[#FF00F0] text-black";
}

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

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as PositionFilter)}>
        <TabsList>
          <TabsTrigger value="active">
            Active <span className="opacity-50">({activeCount})</span>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <span className="opacity-50">({resolvedCount})</span>
          </TabsTrigger>
          <TabsTrigger value="all">
            All <span className="opacity-50">({allCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
                <p>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-sm font-mono font-medium ${pnlHighlightClass(pos.pnl)}`}
                  >
                    {formatCompactCurrency(pos.currentPrice)}
                  </span>
                </p>
                <p className="mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-mono ${pnlHighlightClass(pos.pnl)}`}
                  >
                    {formatPnl(pos.pnl)} {formatPct(pos.pnlPct)}
                  </span>
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

function EquipButton({ skillId, skillName }: { skillId: string; skillName: string }) {
  const { install } = useInstalledSkills();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "installing">("idle");

  function handleEquip() {
    setState("installing");
    setTimeout(() => {
      install(skillId);
      toast(`${skillName} added to your agent`);
    }, 800);
  }

  if (state === "installing") {
    return (
      <span className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground min-h-[44px] w-[120px]">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`${buttonVariants({ variant: "outline" })} w-[120px] gap-1`}
      onClick={handleEquip}
    >
      <PlusIcon size={14} />
      Equip
    </button>
  );
}

function InstalledSkills() {
  const { isInstalled, uninstall, hydrated } = useInstalledSkills();

  const installed = skills.filter((s) => isInstalled(s.id));
  const available = skills.filter((s) => !isInstalled(s.id));

  return (
    <div className={`space-y-3 ${!hydrated ? "opacity-50" : ""}`}>
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
                <button
                  type="button"
                  className="group shrink-0 inline-flex items-center justify-center gap-1 text-sm font-medium rounded-md border border-transparent transition-colors min-h-[44px] w-[120px] bg-[#3FFF00] text-black hover:bg-[#FF00F0] hover:text-black"
                  onClick={() => uninstall(skill.id)}
                >
                  <span className="group-hover:hidden inline-flex items-center gap-1">
                    <CheckIcon size={14} />
                    Equipped
                  </span>
                  <span className="hidden group-hover:inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    Remove
                  </span>
                </button>
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
                <EquipButton skillId={skill.id} skillName={skill.name} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnimatedArrowLink href="/skills">
        Browse all skills
      </AnimatedArrowLink>
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
            <TabsTrigger value="positions" className="gap-1.5">
              <ChartBarIncreasingIcon size={14} />
              Positions
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <ClockIcon size={14} />
              Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <ClockIcon size={14} />
              History
            </TabsTrigger>
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
