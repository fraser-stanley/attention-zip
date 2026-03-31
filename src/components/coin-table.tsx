"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { HoverMediaOverlay } from "@/components/hover-media-overlay";
import { TextMorph } from "@/components/text-morph";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import type { CoinNode, ExploreApiResponse, SortOption } from "@/lib/zora";
import {
  formatCompactCurrency,
  formatChange,
  truncateAddress,
  coinTypeLabel,
} from "@/lib/zora";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

const TICK_MS = 1600;
const REFRESH_INTERVAL_MS = 30_000;

type FlashTone = "green" | "pink" | null;

type BoardCoin = {
  id: string;
  name: string;
  address: string;
  coinType: string | undefined;
  marketCapValue: number;
  marketCap: string;
  volumeValue: number;
  volume24h: string;
  changeValue: number | null;
  changeText: string;
  positive: boolean | null;
};

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function createBoardCoins(coins: CoinNode[]): BoardCoin[] {
  return coins.map((coin, i) => {
    const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
    const changeValue = Number.parseFloat(change.value);
    return {
      id: coin.address ?? coin.name ?? `coin-${i}`,
      name: coin.name ?? "Unknown",
      address: coin.address ?? "",
      coinType: coin.coinType,
      marketCapValue: toNumber(coin.marketCap),
      marketCap: formatCompactCurrency(coin.marketCap),
      volumeValue: toNumber(coin.volume24h),
      volume24h: formatCompactCurrency(coin.volume24h),
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

type PreviewFrame = {
  rows: BoardCoin[];
  flashById: Record<string, FlashTone>;
  rankDeltaById: Record<string, number>;
};

function createPreviewFrame(rows: BoardCoin[], tick: number, reduceMotion: boolean): PreviewFrame {
  if (rows.length === 0 || reduceMotion || tick === 0) {
    return {
      rows,
      flashById: {},
      rankDeltaById: Object.fromEntries(rows.map((r) => [r.id, 0])),
    };
  }

  const flashById: Record<string, FlashTone> = {};
  const previousIndexById = Object.fromEntries(rows.map((r, i) => [r.id, i]));
  const primaryIndex = tick % rows.length;
  const secondaryIndex = (primaryIndex + Math.max(2, Math.floor(rows.length / 2))) % rows.length;
  const direction = tick % 4 < 2 ? 1 : -1;

  const nextRows = rows.map((row, index) => {
    const isPrimary = index === primaryIndex;
    const isSecondary = index === secondaryIndex;
    if (!isPrimary && !isSecondary) return row;

    const amplitude = isPrimary ? 0.012 : 0.006;
    const signedAmplitude = amplitude * (isPrimary ? direction : -direction);
    flashById[row.id] = signedAmplitude >= 0 ? "green" : "pink";

    const marketCapValue = Math.max(1, row.marketCapValue * (1 + signedAmplitude));
    const volumeValue = Math.max(1, row.volumeValue * (1 - signedAmplitude * 1.25));
    const changeValue = row.changeValue === null ? null : row.changeValue + signedAmplitude * 100;

    return {
      ...row,
      marketCapValue,
      marketCap: formatCompactCurrency(marketCapValue),
      volumeValue,
      volume24h: formatCompactCurrency(volumeValue),
      changeValue,
      changeText: formatPercentValue(changeValue),
      positive: changeValue === null ? null : changeValue > 0 ? true : changeValue < 0 ? false : null,
    };
  });

  // Occasional rank swap
  if (rows.length > 3 && tick % 4 === 0) {
    const swapIndex = tick % (rows.length - 1);
    const temp = nextRows[swapIndex];
    nextRows[swapIndex] = nextRows[swapIndex + 1];
    nextRows[swapIndex + 1] = temp;
  }

  const rankDeltaById = Object.fromEntries(
    nextRows.map((row, index) => {
      const prev = previousIndexById[row.id] ?? index;
      return [row.id, prev - index];
    })
  );

  nextRows.forEach((row) => {
    if (flashById[row.id]) return;
    const delta = rankDeltaById[row.id] ?? 0;
    if (delta > 0) flashById[row.id] = "green";
    if (delta < 0) flashById[row.id] = "pink";
  });

  return { rows: nextRows, flashById, rankDeltaById };
}

function changeChipClass(positive: boolean | null, flashTone: FlashTone, isSelected: boolean) {
  if (flashTone) return "text-black";
  if (positive === true) return "bg-[#3FFF00] text-black";
  if (positive === false) return "bg-[#FF00F0] text-black";
  return isSelected ? "text-background/80" : "text-muted-foreground";
}

function BoardSkeleton({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground/50" style={{ minHeight: `${count * 44}px` }}>
      <BrailleSpinner name="scan" className="text-lg" />
    </div>
  );
}

const ROW_SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

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
  const { toast } = useToast();
  const reduceMotion = useReducedMotion() ?? false;
  const [tick, setTick] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const handleRowClick = useCallback((e: React.MouseEvent, coin: BoardCoin) => {
    if (!coin.address) return;
    const pos = { x: e.clientX, y: e.clientY };
    void navigator.clipboard.writeText(coin.address).then(() => {
      setCopiedId(coin.id);
      toast(`Copied ${truncateAddress(coin.address)}`, pos);
      if (copyTimeoutRef.current !== null) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedId(null), 1500);
    });
  }, [toast]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["explore", sort, count],
    queryFn: async () => {
      const res = await fetch(`/api/explore?sort=${sort}&count=${count}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<ExploreApiResponse>;
    },
    initialData: initialCoins
      ? { coins: initialCoins, sort, count }
      : undefined,
    initialDataUpdatedAt: undefined,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const baseRows = useMemo(() => createBoardCoins(data?.coins ?? []), [data]);
  const frame = useMemo(() => createPreviewFrame(baseRows, tick, reduceMotion), [baseRows, tick, reduceMotion]);

  if (error) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        Failed to load data. Try refreshing.
      </div>
    );
  }

  if (isLoading) {
    return <BoardSkeleton count={compact ? 5 : count} />;
  }

  if (baseRows.length === 0) {
    return (
      <div className="type-body-sm py-8 text-center text-muted-foreground">
        No coins found.
      </div>
    );
  }

  const gridCols = compact ? "terminal-board-cols" : "terminal-board-cols-dashboard";

  const minWidth = compact ? "min-w-[44rem]" : "min-w-[56rem]";

  return (
    <div className="relative overflow-x-auto text-sm font-mono" onMouseLeave={() => setHoveredImage(null)}>
      <HoverMediaOverlay imageUrl={hoveredImage} />
      {/* Header */}
      <div
        className={cn(
          "type-label border-b border-border/70 px-4 py-3 font-mono text-muted-foreground",
          gridCols, "grid w-full gap-4", minWidth
        )}
      >
        <span>Rank</span>
        <span>Coin</span>
        {!compact && <span>Address</span>}
        {!compact && <span>Type</span>}
        <span className="text-right">Mcap</span>
        <span className="text-right">24h Vol</span>
        <span className="text-right">24h</span>
      </div>

      {/* Rows */}
      {frame.rows.map((coin, i) => {
        const flashTone = frame.flashById[coin.id] ?? null;
        const isFlash = flashTone !== null;
        const isSelected = coin.id === selectedRowId;

        return (
          <motion.div
            key={coin.id}
            layout
            onClick={(e) => handleRowClick(e, coin)}
            onMouseEnter={() => {
              setSelectedRowId(coin.id);
              setHoveredImage(data?.coins?.[i]?.mediaContent?.previewImage?.medium ?? null);
            }}
            onMouseLeave={() => setSelectedRowId(null)}
            transition={ROW_SPRING}
            style={{
              backgroundColor: flashTone === "green" ? "#3FFF00" : flashTone === "pink" ? "#FF00F0" : undefined,
              transition: flashTone ? "background-color 0s" : "background-color 200ms cubic-bezier(0.33, 1, 0.68, 1)",
            }}
            className={cn(
              "group relative min-h-[44px] cursor-pointer items-center border-b border-border/70 px-4 py-2 last:border-b-0",
              gridCols, "grid w-full gap-4", minWidth,
              isFlash ? "text-black" : "",
              !isFlash && isSelected ? "bg-foreground text-background" : "",
              !isFlash && !isSelected ? "hover:bg-muted/35" : ""
            )}
          >
            {/* Rank */}
            <div
              className={cn(
                "tabular-nums",
                isFlash ? "text-black/60" : isSelected ? "text-background/60" : "text-muted-foreground"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </div>

            {/* Name */}
            <div
              className={cn(
                "truncate",
                isFlash ? "text-black" : isSelected ? "text-background" : "text-foreground"
              )}
            >
              {coin.name}
            </div>

            {/* Address (dashboard only) */}
            {!compact && (
              <div
                className={cn(
                  "truncate",
                  isFlash ? "text-black/60" : isSelected ? "text-background/60" : "text-muted-foreground"
                )}
              >
                {copiedId === coin.id ? "Copied" : truncateAddress(coin.address)}
              </div>
            )}

            {/* Type (dashboard only) */}
            {!compact && (
              <div
                className={cn(
                  isFlash ? "text-black/60" : isSelected ? "text-background/60" : "text-muted-foreground"
                )}
              >
                {coinTypeLabel(coin.coinType)}
              </div>
            )}

            {/* Market Cap */}
            <div className="text-right">
              <TextMorph
                className={cn(
                  "inline-flex px-1.5 py-0.5",
                  isFlash ? "text-black/72" : isSelected ? "text-background/80" : "text-muted-foreground"
                )}
              >
                {coin.marketCap}
              </TextMorph>
            </div>

            {/* Volume */}
            <div className="text-right">
              <TextMorph
                className={cn(
                  "inline-flex px-1.5 py-0.5",
                  isFlash ? "text-black/72" : isSelected ? "text-background/80" : "text-muted-foreground"
                )}
              >
                {coin.volume24h}
              </TextMorph>
            </div>

            {/* 24h Change */}
            <div className="text-right">
              <TextMorph
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 tabular-nums",
                  changeChipClass(coin.positive, flashTone, isSelected)
                )}
              >
                {coin.changeText}
              </TextMorph>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
