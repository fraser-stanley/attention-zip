"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { HoverMediaOverlay } from "@/components/hover-media-overlay";
import { useToast } from "@/components/toast";

import { TextMorph } from "@/components/text-morph";
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { FlameIcon } from "@/components/ui/flame";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import type {
  CoinNode,
  ExploreApiResponse,
} from "@/lib/zora";
import { formatCompactCurrency, formatChange, truncateAddress } from "@/lib/zora";
import { cn } from "@/lib/utils";

type BoardTab = "trending" | "gainers" | "volume";
type FlashTone = "green" | "pink" | null;

type CoinBoardRow = {
  id: string;
  kind: "coin";
  name: string;
  address: string;
  mediaUrl: string | null;
  marketCapValue: number;
  marketCap: string;
  volumeValue: number;
  volume: string;
  changeValue: number | null;
  changeText: string;
  positive: boolean | null;
};

type BoardRow = CoinBoardRow;

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
];
const BOARD_SKELETON_TAB_WIDTHS = ["w-20", "w-[4.75rem]", "w-[4.25rem]"] as const;
const BOARD_SKELETON_ROWS = [
  { coin: "w-[70%]", marketCap: "w-16", volume: "w-14", change: "w-14" },
  { coin: "w-[62%]", marketCap: "w-14", volume: "w-16", change: "w-12" },
  { coin: "w-[78%]", marketCap: "w-16", volume: "w-12", change: "w-13" },
  { coin: "w-[56%]", marketCap: "w-14", volume: "w-14", change: "w-15" },
  { coin: "w-[68%]", marketCap: "w-12", volume: "w-16", change: "w-12" },
  { coin: "w-[74%]", marketCap: "w-16", volume: "w-14", change: "w-14" },
  { coin: "w-[60%]", marketCap: "w-14", volume: "w-12", change: "w-13" },
  { coin: "w-[66%]", marketCap: "w-16", volume: "w-16", change: "w-12" },
] as const;

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
      address: coin.address ?? "",
      mediaUrl: coin.mediaContent?.previewImage?.medium ?? null,
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

    return row;
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

  return `${String(index + 1).padStart(2, "0")} / ${row.name}`;
}

function changeChipClass(positive: boolean | null, flashTone: FlashTone, isSelected: boolean) {
  if (flashTone) return "text-black";
  if (positive === true) return "bg-[#3FFF00] text-black";
  if (positive === false) return "bg-[#FF00F0] text-black";
  return isSelected ? "text-background/80" : "text-muted-foreground";
}

export function HomeLiveCardsSkeleton() {
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

      <div className="flex flex-col gap-2 border-b border-border bg-muted p-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 gap-1 sm:w-auto sm:grid-cols-4">
          {TAB_DEFS.map((tab, index) => (
            <div
              key={tab.id}
              className={cn(
                "flex min-h-[44px] sm:min-h-[32px] items-center rounded-sm px-2.5 py-1",
                index === 0 ? "bg-foreground text-background" : "bg-transparent"
              )}
            >
              <Skeleton
                className={cn(
                  "h-4",
                  BOARD_SKELETON_TAB_WIDTHS[index],
                  index === 0 ? "bg-background/20 text-background/50" : "bg-foreground/10"
                )}
              />
            </div>
          ))}
        </div>

        <div className="type-caption hidden px-2 text-right font-mono text-muted-foreground sm:block sm:pr-2">
          <div className="flex justify-end">
            <Skeleton className="h-4 w-20 bg-foreground/10" />
          </div>
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
            {BOARD_SKELETON_ROWS.map((widths, index) => (
              <div
                key={index}
                className="terminal-board-cols grid min-h-[44px] w-full items-center border-b border-border/70 px-4 py-2 last:border-b-0"
              >
                <div className="type-body-sm font-mono tabular-nums text-muted-foreground/60">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <Skeleton className={cn("h-3 bg-foreground/10", widths.coin)} />
                <div className="flex justify-end">
                  <Skeleton className={cn("h-3 bg-foreground/10", widths.marketCap)} />
                </div>
                <div className="flex justify-end">
                  <Skeleton className={cn("h-3 bg-foreground/10", widths.volume)} />
                </div>
                <div className="flex justify-end">
                  <Skeleton className={cn("h-7 bg-foreground/10", widths.change)} />
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
  onSelect,
  onMediaHover,
  onClick,
}: {
  row: BoardRow;
  index: number;
  flashTone: FlashTone;
  isSelected: boolean;
  onSelect: (rowId: string) => void;
  onMediaHover: (url: string | null) => void;
  onClick: (e: React.MouseEvent, row: BoardRow) => void;
}) {
  const isFlash = flashTone !== null;
  const mediaUrl = row.kind === "coin" ? row.mediaUrl : null;

  return (
    <motion.div
      layout
      onClick={(e) => onClick(e, row)}
      onMouseEnter={() => {
        onSelect(row.id);
        onMediaHover(mediaUrl);
      }}
      onMouseLeave={() => onMediaHover(null)}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 34,
        mass: 0.7,
      }}
      style={{
        backgroundColor: flashTone === "green" ? "#3FFF00" : flashTone === "pink" ? "#FF00F0" : undefined,
        transition: flashTone ? "background-color 0s" : "background-color 200ms cubic-bezier(0.33, 1, 0.68, 1)",
      }}
      className={cn(
        "group relative min-h-[44px] cursor-pointer items-center border-b border-border/70 px-4 py-2 last:border-b-0",
        "terminal-board-cols grid min-w-[44rem] w-full gap-4",
        isFlash ? "text-black" : "",
        !isFlash && isSelected ? "bg-foreground text-background" : "",
        !isFlash && !isSelected ? "hover:bg-muted/35" : ""
      )}
    >
      <div
        className={cn(
          "type-body-sm font-mono tabular-nums",
          isFlash ? "text-black/60" : isSelected ? "text-background/60" : "text-muted-foreground"
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

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
    </motion.div>
  );
}

export function HomeLiveCards({
  initialCoins,
}: {
  initialCoins?: Partial<Record<"trending" | "gainers" | "volume", CoinNode[]>>;
}) {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion() ?? false;
  const [hoveredMediaUrl, setHoveredMediaUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BoardTab>("trending");
  const [previewTick, setPreviewTick] = useState(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<BoardTab, string | null>>({
    trending: null,
    gainers: null,
    volume: null,
  });
  const handleRowClick = useCallback((e: React.MouseEvent, row: BoardRow) => {
    const address = row.address;
    if (!address || !address.startsWith("0x")) return;
    const pos = { x: e.clientX, y: e.clientY };
    void navigator.clipboard.writeText(address).then(() => {
      toast(`Copied ${truncateAddress(address)}`, pos);
    });
  }, [toast]);

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
    }),
    [
      trendingQuery.data?.coins,
      trendingQuery.isLoading,
      gainersQuery.data?.coins,
      gainersQuery.isLoading,
      volumeQuery.data?.coins,
      volumeQuery.isLoading,
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
        <div className="flex flex-col gap-2 border-b border-border bg-muted p-1 sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            className="grid w-full grid-cols-2 bg-transparent p-0 sm:w-auto sm:grid-cols-4"
          >
            {TAB_DEFS.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1"
                >
                  <Icon size={12} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="type-caption hidden px-2 text-right font-mono text-muted-foreground sm:block sm:pr-2">
            {rowSummary(selectedRow, selectedRowIndex)}
          </div>
        </div>

        {TAB_DEFS.map((tab) => {
          const board = boardData[tab.id];
          const visibleRows = tab.id === activeTab ? activeRows : board.rows;
          const flashById = tab.id === activeTab ? previewFrame.flashById : {};
          const visibleSelectedRowId = tab.id === activeTab ? selectedRowId : null;

          return (
            <TabsContent key={tab.id} value={tab.id} className="m-0">
              {board.isLoading && visibleRows.length === 0 ? (
                <HomeLiveCardsSkeleton />
              ) : (
                <div
                  className="relative overflow-x-auto"
                  onMouseLeave={() => setHoveredMediaUrl(null)}
                >
                  {tab.id === activeTab && (
                    <HoverMediaOverlay imageUrl={hoveredMediaUrl} />
                  )}
                  <div
                    className={cn(
                      "type-label border-b border-border/70 px-4 py-3 text-muted-foreground",
                      "terminal-board-cols grid min-w-[44rem] w-full gap-4"
                    )}
                  >
                    <span>Rank</span>
                    <span>Coin</span>
                    <span className="text-right">Mcap</span>
                    <span className="text-right">24h Vol</span>
                    <span className="text-right">24h</span>
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
                          onSelect={(rowId) => {
                            if (tab.id === activeTab) {
                              updateSelectedRow(tab.id, rowId);
                            }
                          }}
                          onMediaHover={tab.id === activeTab ? setHoveredMediaUrl : () => {}}
                          onClick={handleRowClick}
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
