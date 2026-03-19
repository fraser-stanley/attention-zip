"use client";

import NumberFlow, { NumberFlowGroup, type Format } from "@number-flow/react";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TextMorph } from "@/components/text-morph";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatPnl, formatPct } from "@/lib/pnl-utils";
import { skills } from "@/lib/skills";
import { MOCK_PORTFOLIO, type MockPosition } from "@/lib/portfolio-mock-data";
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { ClockIcon } from "@/components/ui/clock";
import { CheckIcon } from "@/components/ui/check";
import { PlusIcon } from "@/components/ui/plus";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { useToast } from "@/components/toast";

type PositionFilter = "active" | "resolved" | "all";

const activeCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "active").length;
const resolvedCount = MOCK_PORTFOLIO.positions.filter((p) => p.status === "resolved").length;
const allCount = MOCK_PORTFOLIO.positions.length;
// Snappy spring-like easing for number transitions
const TIMING_TRANSFORM: EffectTiming = {
  duration: 650,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out-expo
};
const TIMING_SPIN: EffectTiming = {
  duration: 650,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};
const TIMING_OPACITY: EffectTiming = {
  duration: 350,
  easing: "ease-out",
};

const FLOW_TIMING = {
  transformTiming: TIMING_TRANSFORM,
  spinTiming: TIMING_SPIN,
  opacityTiming: TIMING_OPACITY,
} as const;

const FMT_CURRENCY = {
  style: "currency",
  currency: "USD",
  signDisplay: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} satisfies Format;
const FMT_PERCENT = {
  style: "percent",
  signDisplay: "always",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} satisfies Format;
const FMT_COMPACT = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
} satisfies Format;
const FMT_INT = { maximumFractionDigits: 0 } satisfies Format;
const FMT_PRICE = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
} satisfies Format;
const FMT_PCT_UNSIGNED = {
  style: "percent",
  maximumFractionDigits: 0,
} satisfies Format;

function pnlHighlightClass(value: number) {
  return value >= 0 ? "bg-[#3FFF00] text-black" : "bg-[#FF00F0] text-black";
}

function pnlHighlightBlockClass(value: number) {
  return `inline px-[0.15em] py-[0.02em] leading-[1.4] box-decoration-clone [-webkit-box-decoration-break:clone] ${pnlHighlightClass(value)}`;
}

const TICK_MS = 2500;

/** Simple deterministic hash for stable oscillation per tick+seed. */
function pseudoRandom(tick: number, seed: number) {
  const x = Math.sin(tick * 9301 + seed * 49297) * 49979;
  return x - Math.floor(x);
}

function drift(base: number, amplitude: number, tick: number, seed: number) {
  return base + (pseudoRandom(tick, seed) - 0.45) * amplitude;
}

function useSimulatedPortfolio() {
  const reduceMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return useMemo(() => {
    const base = MOCK_PORTFOLIO;
    if (tick === 0) return base;

    // Oscillate positions using deterministic pseudo-random per tick
    const positions = base.positions.map((pos, i) => {
      const priceDelta = pos.currentPrice * (pseudoRandom(tick, i) - 0.45) * 0.015;
      const currentPrice = Math.max(1, pos.currentPrice + priceDelta);
      const pnl = currentPrice - pos.entryPrice;
      const pnlPct = (pnl / pos.entryPrice) * 100;

      return { ...pos, currentPrice, pnl, pnlPct };
    });

    // Derive totals from positions
    const totalValue = positions.reduce((sum, p) => sum + p.currentPrice, 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalEntry = positions.reduce((sum, p) => sum + p.entryPrice, 0);
    const totalPnlPct = (totalPnl / totalEntry) * 100;

    // Small oscillation on win rate
    const winRate = Math.round(drift(base.pnl.winRate, 1.5, tick, 100));
    const wins = Math.round(drift(base.pnl.wins, 0.8, tick, 200));
    const losses = base.pnl.totalTrades - wins;

    return {
      ...base,
      totalValue,
      positions,
      pnl: {
        ...base.pnl,
        totalPnl,
        totalPnlPct,
        winRate: Math.max(0, Math.min(100, winRate)),
        wins: Math.max(0, wins),
        losses: Math.max(0, losses),
      },
    };
  }, [tick]);
}

/* ─── Simmer-style 2×2 stats grid ─── */
function PnlStats({ pnl }: { pnl: typeof MOCK_PORTFOLIO.pnl }) {
  return (
    <NumberFlowGroup>
      <div className="grid grid-cols-2 gap-px">
        {/* Profit / Loss */}
        <div className="p-4">
          <p className="type-label mb-2 text-muted-foreground">Profit / Loss</p>
          <p className="text-5xl font-bold font-display">
            <span className={pnlHighlightBlockClass(pnl.totalPnl)}>
              <NumberFlow {...FLOW_TIMING} format={FMT_CURRENCY} value={pnl.totalPnl} />
            </span>
            <span
              className={`type-body-sm ml-2 inline-flex items-center px-1.5 py-0.5 font-mono align-middle ${pnlHighlightClass(pnl.totalPnlPct)}`}
            >
              <NumberFlow
                format={FMT_PERCENT}
                suffix=" ROI"
                value={pnl.totalPnlPct / 100}
              />
            </span>
          </p>
        </div>

        {/* Trades */}
        <div className="p-4 border-l border-border">
          <p className="type-label mb-2 text-muted-foreground">Trades</p>
          <p className="text-5xl font-bold font-display">
            <NumberFlow {...FLOW_TIMING} format={FMT_INT} value={pnl.totalTrades} />
          </p>
        </div>

        {/* Win Rate */}
        <div className="p-4 border-t border-border">
          <p className="type-label mb-2 text-muted-foreground">Win Rate</p>
          <p className="text-5xl font-bold font-display">
            <NumberFlow {...FLOW_TIMING} format={FMT_PCT_UNSIGNED} value={pnl.winRate / 100} />
          </p>
        </div>

        {/* W / L */}
        <div className="p-4 border-t border-l border-border">
          <p className="type-label mb-2 text-muted-foreground">W / L</p>
          <p className="text-5xl font-bold font-display">
            <span className="inline-flex items-baseline gap-2">
              <NumberFlow {...FLOW_TIMING} format={FMT_INT} value={pnl.wins} />
              <span>/</span>
              <NumberFlow {...FLOW_TIMING} format={FMT_INT} value={pnl.losses} />
            </span>
          </p>
        </div>
      </div>
    </NumberFlowGroup>
  );
}



/* ─── Positions tab content ─── */
function PositionsContent({ positions, totalValue }: { positions: MockPosition[]; totalValue: number }) {
  const [filter, setFilter] = useState<PositionFilter>("active");

  const filtered = positions.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <p className="font-display text-5xl tracking-tight py-6">
        {activeCount} positions open,{" "}
        <NumberFlow {...FLOW_TIMING} format={FMT_COMPACT} value={totalValue} /> total value
      </p>

      {/* Terminal-style table with filter tabs inside */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as PositionFilter)} className="gap-0">
        <div className="overflow-hidden border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border bg-muted p-1 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 sm:w-auto">
              <TabsTrigger value="active" className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1">
                Active <span className="ml-1 opacity-50">({activeCount})</span>
              </TabsTrigger>
              <TabsTrigger value="resolved" className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1">
                Resolved <span className="ml-1 opacity-50">({resolvedCount})</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1">
                All <span className="ml-1 opacity-50">({allCount})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="m-0">
            <div className="overflow-x-auto">
              {/* Column headers */}
              <div className="terminal-board-cols-positions grid min-w-[40rem] w-full gap-4 border-b border-border/70 px-4 py-3 type-label text-muted-foreground">
                <span>Market</span>
                <span className="text-right">Avg</span>
                <span className="text-right">Current</span>
                <span className="text-right">Value</span>
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div className="type-body-sm px-4 py-8 text-muted-foreground">
                  No {filter} positions.
                </div>
              ) : (
                <div>
                  {filtered.map((pos) => {
                    const avgPrice = pos.entryPrice / pos.quantity;
                    const currentUnitPrice = pos.currentPrice / pos.quantity;

                    return (
                      <div
                        key={pos.address}
                        className="terminal-board-cols-positions grid min-w-[40rem] w-full items-center gap-4 min-h-[44px] border-b border-border/70 px-4 py-2 last:border-b-0 hover:bg-muted/35"
                      >
                        <div>
                          <div>
                            <span className="type-body-sm font-medium">{pos.coin}</span>
                            <span className="type-caption ml-2 font-mono text-muted-foreground">
                              ${pos.symbol}
                            </span>
                          </div>
                          <p className="type-caption mt-0.5 font-mono text-muted-foreground">
                            {pos.quantity.toLocaleString()} tokens at ${avgPrice.toFixed(4)}
                          </p>
                        </div>
                        <div className="type-body-sm text-right font-mono text-muted-foreground">
                          ${avgPrice.toFixed(4)}
                        </div>
                        <div className="type-body-sm text-right font-mono text-muted-foreground">
                          <NumberFlow {...FLOW_TIMING} format={FMT_PRICE} value={currentUnitPrice} />
                        </div>
                        <div className="text-right">
                          <p>
                            <span
                              className={`type-body-sm inline-flex items-center px-1.5 py-0.5 font-mono font-medium ${pnlHighlightClass(pos.currentPrice)}`}
                            >
                              <NumberFlow {...FLOW_TIMING} format={FMT_COMPACT} value={pos.currentPrice} />
                            </span>
                          </p>
                          <p className="mt-0.5">
                            <span
                              className={`type-caption inline-flex items-center px-1.5 py-0.5 font-mono ${pnlHighlightClass(pos.pnl)}`}
                            >
                              <NumberFlowGroup>
                                <span className="inline-flex items-center gap-1">
                                  <NumberFlow {...FLOW_TIMING} format={FMT_CURRENCY} value={pos.pnl} />
                                  <NumberFlow {...FLOW_TIMING} format={FMT_PERCENT} value={pos.pnlPct / 100} />
                                </span>
                              </NumberFlowGroup>
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ─── History tab (recent trades) ─── */
function HistoryContent() {
  const trades = MOCK_PORTFOLIO.recentTrades;

  return (
    <div className="overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        {/* Column headers */}
        <div className="terminal-board-cols-history grid min-w-[40rem] w-full gap-4 border-b border-border/70 px-4 py-3 type-label text-muted-foreground">
          <span>Coin</span>
          <span>Side</span>
          <span className="text-right">Amount</span>
          <span className="text-right">PnL</span>
          <span className="text-right">Date</span>
        </div>

        {/* Rows */}
        <div>
          {trades.map((trade) => (
            <div
              key={`${trade.coin}-${trade.date}`}
              className="terminal-board-cols-history grid min-w-[40rem] w-full items-center gap-4 min-h-[44px] border-b border-border/70 px-4 py-2 last:border-b-0 hover:bg-muted/35"
            >
              <div className="type-body-sm font-mono">${trade.coin}</div>
              <div>
                <Badge variant={trade.side === "buy" ? "default" : "outline"}>
                  {trade.side}
                </Badge>
              </div>
              <div className="type-body-sm text-right font-mono text-muted-foreground">
                ${trade.amount.toLocaleString()}
              </div>
              <div className="type-body-sm text-right font-mono">
                <span className={`inline-flex items-center px-1.5 py-0.5 font-medium ${pnlHighlightClass(trade.pnl)}`}>
                  {formatPnl(trade.pnl)}
                  <span className="type-caption ml-1">{formatPct(trade.pct)}</span>
                </span>
              </div>
              <div className="type-body-sm text-right text-muted-foreground">
                {trade.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Skills section ─── */

function InstallButton({ skillId, skillName }: { skillId: string; skillName: string }) {
  const { install } = useInstalledSkills();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "installing">("idle");

  function handleInstall() {
    setState("installing");
    setTimeout(() => {
      install(skillId);
      toast(`${skillName} added to your agent`);
    }, 800);
  }

  return (
    <AnimatedButton
      variant="outline"
      className="w-[120px] gap-1"
      disabled={state === "installing"}
      onClick={state === "idle" ? handleInstall : undefined}
    >
      {state === "installing" ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      ) : (
        <PlusIcon size={14} />
      )}
      <TextMorph>{state === "installing" ? "Installing..." : "Install"}</TextMorph>
    </AnimatedButton>
  );
}

function InstalledSkills() {
  const { isInstalled, uninstall } = useInstalledSkills();

  const installed = skills.filter((s) => isInstalled(s.id));
  const available = skills.filter((s) => !isInstalled(s.id));

  return (
    <div className="space-y-3">
      <h2 className="type-label text-foreground">Agent Loadout</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {installed.map((skill) => (
          <Card key={skill.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-body-sm font-medium">{skill.name}</p>
                  <p className="type-caption mt-1 text-muted-foreground">
                    {skill.description}
                  </p>
                </div>
                <button
                  type="button"
                  className="type-body-sm group inline-flex min-h-[44px] w-[120px] shrink-0 items-center justify-center gap-1 rounded-md border border-transparent bg-[#3FFF00] font-medium text-black transition-colors hover:bg-[#FF00F0] hover:text-black"
                  onClick={() => uninstall(skill.id)}
                >
                  <span className="group-hover:hidden inline-flex items-center gap-1">
                    <CheckIcon size={14} />
                    Installed
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
                  <p className="type-body-sm font-medium">{skill.name}</p>
                  <p className="type-caption mt-1 text-muted-foreground">
                    {skill.description}
                  </p>
                </div>
                <InstallButton skillId={skill.id} skillName={skill.name} />
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
  const portfolio = useSimulatedPortfolio();

  return (
    <div className="space-y-8">
      {/* Stats */}
      <PnlStats pnl={portfolio.pnl} />

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
            <PositionsContent positions={portfolio.positions} totalValue={portfolio.totalValue} />
          </TabsContent>

          <TabsContent value="orders">
            <p className="font-display text-5xl tracking-tight py-6">
              No open orders
            </p>
          </TabsContent>

          <TabsContent value="history">
            <p className="font-display text-5xl tracking-tight py-6">
              {MOCK_PORTFOLIO.recentTrades.length} trades
            </p>
            <HistoryContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Skills */}
      <InstalledSkills />
    </div>
  );
}
