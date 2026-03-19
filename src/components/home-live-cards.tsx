"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";

import { TextMorph } from "@/components/text-morph";
import { ActivityIcon } from "@/components/ui/activity";
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { FlameIcon } from "@/components/ui/flame";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import type {
  CoinNode,
  ExploreApiResponse,
  LeaderboardApiResponse,
  TraderNode,
} from "@/lib/zora";
import { formatCompactCurrency, formatChange, truncateAddress } from "@/lib/zora";
import { cn } from "@/lib/utils";

type BoardTab = "trending" | "gainers" | "volume" | "traders";
type FlashTone = "green" | "pink" | null;

type CoinBoardRow = {
  id: string;
  kind: "coin";
  name: string;
  marketCapValue: number;
  marketCap: string;
  volumeValue: number;
  volume: string;
  changeValue: number | null;
  changeText: string;
  positive: boolean | null;
};

type TraderBoardRow = {
  id: string;
  kind: "trader";
  trader: string;
  volumeValue: number;
  volume: string;
};

type BoardRow = CoinBoardRow | TraderBoardRow;

type PreviewFrame = {
  rows: BoardRow[];
  flashById: Record<string, FlashTone>;
  rankDeltaById: Record<string, number>;
};

const ROW_COUNT = 8;
const REFRESH_INTERVAL_MS = 30_000;

const TAB_DEFS: Array<{
  id: BoardTab;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { id: "trending", label: "Trending", icon: FlameIcon },
  { id: "gainers", label: "Gainers", icon: TrendingUpIcon },
  { id: "volume", label: "Volume", icon: ChartBarIncreasingIcon },
  { id: "traders", label: "Traders", icon: ActivityIcon },
];

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function createCoinRows(coins: CoinNode[] = []): CoinBoardRow[] {
  return coins.map((coin, index) => {
    const id = coin.address ?? coin.name ?? `coin-${index}`;
    const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
    const changeValue = Number.parseFloat(change.value);

    return {
      id,
      kind: "coin",
      name: coin.name ?? coin.symbol ?? "Unknown",
      marketCapValue: toNumber(coin.marketCap),
      marketCap: formatCompactCurrency(coin.marketCap),
      volumeValue: toNumber(coin.volume24h),
      volume: formatCompactCurrency(coin.volume24h),
      changeValue: Number.isFinite(changeValue) ? changeValue : null,
      changeText: change.value,
      positive: change.positive,
    };
  });
}

function createTraderRows(traders: TraderNode[] = []): TraderBoardRow[] {
  return traders.map((trader, index) => ({
    id: trader.address ?? `trader-${index}`,
    kind: "trader",
    trader: truncateAddress(trader.address ?? ""),
    volumeValue: toNumber(trader.volume),
    volume: formatCompactCurrency(trader.volume),
  }));
}

function formatPercentValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "\u2014";

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function createPreviewFrame(rows: BoardRow[], tick: number, reduceMotion: boolean): PreviewFrame {
  if (rows.length === 0 || reduceMotion || tick === 0) {
    return {
      rows,
      flashById: {},
      rankDeltaById: Object.fromEntries(rows.map((row) => [row.id, 0])),
    };
  }

  const flashById: Record<string, FlashTone> = {};
  const previousIndexById = Object.fromEntries(rows.map((row, index) => [row.id, index]));
  const primaryIndex = tick % rows.length;
  const secondaryIndex = (primaryIndex + Math.max(2, Math.floor(rows.length / 2))) % rows.length;
  const direction = tick % 4 < 2 ? 1 : -1;

  const nextRows = rows.map((row, index) => {
    const isPrimary = index === primaryIndex;
    const isSecondary = index === secondaryIndex;

    if (!isPrimary && !isSecondary) return row;

    const amplitude = isPrimary ? 0.012 : 0.006;
    const signedAmplitude = amplitude * (isPrimary ? direction : -direction);
    const tone: FlashTone = signedAmplitude >= 0 ? "green" : "pink";
    flashById[row.id] = tone;

    if (row.kind === "coin") {
      const marketCapValue = Math.max(1, row.marketCapValue * (1 + signedAmplitude));
      const volumeValue = Math.max(1, row.volumeValue * (1 - signedAmplitude * 1.25));
      const changeValue =
        row.changeValue === null ? null : row.changeValue + signedAmplitude * 100;

      return {
        ...row,
        marketCapValue,
        marketCap: formatCompactCurrency(marketCapValue),
        volumeValue,
        volume: formatCompactCurrency(volumeValue),
        changeValue,
        changeText: formatPercentValue(changeValue),
        positive: changeValue === null ? null : changeValue > 0 ? true : changeValue < 0 ? false : null,
      };
    }

    const volumeValue = Math.max(1, row.volumeValue * (1 + signedAmplitude));

    return {
      ...row,
      volumeValue,
      volume: formatCompactCurrency(volumeValue),
    };
  });

  if (rows.length > 3 && tick % 4 === 0) {
    const swapIndex = tick % (rows.length - 1);
    const temp = nextRows[swapIndex];
    nextRows[swapIndex] = nextRows[swapIndex + 1];
    nextRows[swapIndex + 1] = temp;
  }

  const rankDeltaById = Object.fromEntries(
    nextRows.map((row, index) => {
      const previousIndex = previousIndexById[row.id] ?? index;
      return [row.id, previousIndex - index];
    })
  );

  nextRows.forEach((row) => {
    if (flashById[row.id]) return;

    const rankDelta = rankDeltaById[row.id] ?? 0;
    if (rankDelta > 0) flashById[row.id] = "green";
    if (rankDelta < 0) flashById[row.id] = "pink";
  });

  return {
    rows: nextRows,
    flashById,
    rankDeltaById,
  };
}

function rowSummary(row: BoardRow | null, index: number) {
  if (!row) return "";

  const label = row.kind === "coin" ? row.name : row.trader;
  return `${String(index + 1).padStart(2, "0")} / ${label}`;
}

function changeChipClass(positive: boolean | null, flashTone: FlashTone, isSelected: boolean) {
  if (flashTone) return "text-black";
  if (positive === true) return "bg-[#3FFF00] text-black";
  if (positive === false) return "bg-[#FF00F0] text-black";
  return isSelected ? "text-background/80" : "text-muted-foreground";
}

function BoardSkeleton() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="relative overflow-hidden border border-border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0, rgba(15, 23, 42, 0.06) 1px, transparent 1px, transparent 7px)",
        }}
      />
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-14"
          initial={{ y: "-18%" }}
          animate={{ y: ["-18%", "118%"] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(17,24,39,0.08) 40%, rgba(255,255,255,0) 100%)",
          }}
        />
      ) : null}

      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid w-full max-w-[33rem] grid-cols-2 gap-1 bg-muted p-1 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-foreground/10" />
            ))}
          </div>
          <Skeleton className="h-4 w-20 bg-foreground/10" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[44rem] px-4 py-3">
          <div className="terminal-board-cols type-label mb-3 grid w-full gap-4 text-muted-foreground/70">
            <span>Rank</span>
            <span>Coin</span>
            <span className="text-right">Mcap</span>
            <span className="text-right">24h Vol</span>
            <span className="text-right">24h</span>
          </div>

          <div className="space-y-0">
            {Array.from({ length: ROW_COUNT }).map((_, index) => (
              <div
                key={index}
                className="terminal-board-cols grid min-h-[42px] w-full items-center border-b border-border/70 py-2 last:border-b-0"
              >
                <span className="type-body-sm pl-4 font-mono text-muted-foreground/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Skeleton className="h-3 w-[72%] bg-foreground/10" />
                <div className="flex justify-end">
                  <Skeleton className="h-3 w-16 bg-foreground/10" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-3 w-16 bg-foreground/10" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-7 w-14 bg-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalRow({
  row,
  index,
  flashTone,
  isSelected,
  rankDelta,
  onSelect,
}: {
  row: BoardRow;
  index: number;
  flashTone: FlashTone;
  isSelected: boolean;
  rankDelta: number;
  onSelect: (rowId: string) => void;
}) {
  const movementLabel =
    rankDelta > 0 ? `+${rankDelta}` : rankDelta < 0 ? `${rankDelta}` : null;
  const isFlash = flashTone !== null;

  return (
    <motion.div
      layout
      onMouseEnter={() => onSelect(row.id)}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 34,
        mass: 0.7,
      }}
      className={cn(
        "group relative min-h-[42px] cursor-default items-center border-b border-border/70 px-4 py-2 last:border-b-0",
        row.kind === "coin"
          ? "terminal-board-cols grid min-w-[44rem] w-full gap-4"
          : "terminal-board-cols-trader grid min-w-[34rem] w-full gap-4",
        flashTone === "green" ? "bg-[#3FFF00] text-black" : "",
        flashTone === "pink" ? "bg-[#FF00F0] text-black" : "",
        !isFlash && isSelected ? "bg-foreground text-background" : "",
        !isFlash && !isSelected ? "hover:bg-muted/35" : ""
      )}
    >
      <div
        className={cn(
          "type-body-sm flex items-center gap-2 font-mono",
          isFlash ? "text-black/72" : isSelected ? "text-background/72" : "text-muted-foreground"
        )}
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isFlash ? "bg-black" : isSelected ? "bg-background" : "bg-foreground/25"
          )}
        />
        <span>{String(index + 1).padStart(2, "0")}</span>
        {movementLabel ? (
          <span
            className={cn(
              "type-caption",
              isFlash ? "text-black" : rankDelta > 0 ? "text-[#198754]" : "text-[#9f3f84]"
            )}
          >
            {movementLabel}
          </span>
        ) : null}
      </div>

      {row.kind === "coin" ? (
        <>
          <div
            className={cn(
              "type-body-sm truncate font-medium",
              isFlash ? "text-black" : isSelected ? "text-background" : "text-foreground"
            )}
          >
            {row.name}
          </div>
          <div className="text-right">
            <TextMorph
              className={cn(
                "type-body-sm inline-flex rounded-sm px-1.5 py-0.5",
                isFlash ? "text-black/72" : isSelected ? "text-background/80" : "text-muted-foreground"
              )}
            >
              {row.marketCap}
            </TextMorph>
          </div>
          <div className="text-right">
            <TextMorph
              className={cn(
                "type-body-sm inline-flex rounded-sm px-1.5 py-0.5",
                isFlash ? "text-black/72" : isSelected ? "text-background/80" : "text-muted-foreground"
              )}
            >
              {row.volume}
            </TextMorph>
          </div>
          <div className="text-right">
            <TextMorph
              className={cn(
                "type-body-sm inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono font-medium",
                changeChipClass(row.positive, flashTone, isSelected)
              )}
            >
              {row.changeText}
            </TextMorph>
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "type-body-sm truncate font-mono",
              isFlash ? "text-black" : isSelected ? "text-background" : "text-foreground"
            )}
          >
            {row.trader}
          </div>
          <div className="text-right">
            <TextMorph
              className={cn(
                "type-body-sm inline-flex rounded-sm px-1.5 py-0.5",
                isFlash ? "text-black/72" : isSelected ? "text-background/80" : "text-muted-foreground"
              )}
            >
              {row.volume}
            </TextMorph>
          </div>
        </>
      )}
    </motion.div>
  );
}

export function HomeLiveCards({
  initialCoins,
  initialTraders,
}: {
  initialCoins?: Partial<Record<"trending" | "gainers" | "volume", CoinNode[]>>;
  initialTraders?: TraderNode[];
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeTab, setActiveTab] = useState<BoardTab>("trending");
  const [previewTick, setPreviewTick] = useState(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<BoardTab, string | null>>({
    trending: null,
    gainers: null,
    volume: null,
    traders: null,
  });

  useEffect(() => {
    if (reduceMotion) return;

    const intervalId = window.setInterval(() => {
      setPreviewTick((currentTick) => currentTick + 1);
    }, 1600);

    return () => window.clearInterval(intervalId);
  }, [reduceMotion]);

  const trendingQuery = useQuery({
    queryKey: ["explore", "trending", ROW_COUNT],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=trending&count=${ROW_COUNT}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins?.trending
      ? { coins: initialCoins.trending, sort: "trending" as const, count: ROW_COUNT }
      : undefined,
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const gainersQuery = useQuery({
    queryKey: ["explore", "gainers", ROW_COUNT],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=gainers&count=${ROW_COUNT}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins?.gainers
      ? { coins: initialCoins.gainers, sort: "gainers" as const, count: ROW_COUNT }
      : undefined,
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const volumeQuery = useQuery({
    queryKey: ["explore", "volume", ROW_COUNT],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=volume&count=${ROW_COUNT}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins?.volume
      ? { coins: initialCoins.volume, sort: "volume" as const, count: ROW_COUNT }
      : undefined,
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const tradersQuery = useQuery({
    queryKey: ["leaderboard", ROW_COUNT],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?count=${ROW_COUNT}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<LeaderboardApiResponse>;
    },
    initialData: initialTraders ? { traders: initialTraders, count: ROW_COUNT } : undefined,
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const boardData = useMemo(
    () => ({
      trending: {
        rows: createCoinRows(trendingQuery.data?.coins),
        isLoading: trendingQuery.isLoading,
      },
      gainers: {
        rows: createCoinRows(gainersQuery.data?.coins),
        isLoading: gainersQuery.isLoading,
      },
      volume: {
        rows: createCoinRows(volumeQuery.data?.coins),
        isLoading: volumeQuery.isLoading,
      },
      traders: {
        rows: createTraderRows(tradersQuery.data?.traders),
        isLoading: tradersQuery.isLoading,
      },
    }),
    [
      trendingQuery.data?.coins,
      trendingQuery.isLoading,
      gainersQuery.data?.coins,
      gainersQuery.isLoading,
      volumeQuery.data?.coins,
      volumeQuery.isLoading,
      tradersQuery.data?.traders,
      tradersQuery.isLoading,
    ]
  );

  const activeBoard = boardData[activeTab];
  const previewFrame = useMemo(
    () => createPreviewFrame(activeBoard.rows, previewTick, reduceMotion),
    [activeBoard.rows, previewTick, reduceMotion]
  );
  const activeRows = previewFrame.rows;
  const selectedRowId =
    selectedRowIds[activeTab] && activeRows.some((row) => row.id === selectedRowIds[activeTab])
      ? selectedRowIds[activeTab]
      : activeRows[0]?.id ?? null;
  const selectedRowIndex = Math.max(
    0,
    activeRows.findIndex((row) => row.id === selectedRowId)
  );
  const selectedRow = activeRows[selectedRowIndex] ?? null;

  function updateSelectedRow(tab: BoardTab, rowId: string) {
    setSelectedRowIds((currentSelection) =>
      currentSelection[tab] === rowId
        ? currentSelection
        : {
            ...currentSelection,
            [tab]: rowId,
          }
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BoardTab)} className="gap-0">
      <div className="overflow-hidden border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            variant="toggle"
            className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4"
          >
            {TAB_DEFS.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="type-caption min-h-[32px] gap-1.5 px-2.5 py-1"
                >
                  <Icon size={12} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="type-caption px-3 pb-2 text-right font-mono text-muted-foreground sm:pb-0 sm:pr-3">
            {rowSummary(selectedRow, selectedRowIndex)}
          </div>
        </div>

        {TAB_DEFS.map((tab) => {
          const board = boardData[tab.id];
          const isTraderMode = tab.id === "traders";
          const visibleRows = tab.id === activeTab ? activeRows : board.rows;
          const flashById = tab.id === activeTab ? previewFrame.flashById : {};
          const rankDeltaById = tab.id === activeTab ? previewFrame.rankDeltaById : {};
          const visibleSelectedRowId = tab.id === activeTab ? selectedRowId : null;

          return (
            <TabsContent key={tab.id} value={tab.id} className="m-0">
              {board.isLoading && visibleRows.length === 0 ? (
                <BoardSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className={cn(
                      "type-label border-b border-border/70 px-4 py-3 text-muted-foreground",
                      isTraderMode
                        ? "terminal-board-cols-trader grid min-w-[34rem] w-full gap-4"
                        : "terminal-board-cols grid min-w-[44rem] w-full gap-4"
                    )}
                  >
                    <span>Rank</span>
                    <span>{isTraderMode ? "Trader" : "Coin"}</span>
                    {isTraderMode ? (
                      <span className="text-right">Volume</span>
                    ) : (
                      <>
                        <span className="text-right">Mcap</span>
                        <span className="text-right">24h Vol</span>
                        <span className="text-right">24h</span>
                      </>
                    )}
                  </div>

                  <div>
                    {visibleRows.length === 0 ? (
                      <div className="type-body-sm px-4 py-8 text-muted-foreground">
                        No live data yet.
                      </div>
                    ) : (
                      visibleRows.map((row, index) => (
                        <TerminalRow
                          key={row.id}
                          row={row}
                          index={index}
                          flashTone={flashById[row.id] ?? null}
                          isSelected={visibleSelectedRowId === row.id}
                          rankDelta={rankDeltaById[row.id] ?? 0}
                          onSelect={(rowId) => {
                            if (tab.id === activeTab) {
                              updateSelectedRow(tab.id, rowId);
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}
