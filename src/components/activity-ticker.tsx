"use client";

import { useQuery } from "@tanstack/react-query";
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TradeActivityItem } from "@/lib/activity-mock-data";
import { type ActivityApiResponse } from "@/lib/zora";

export type { TradeActivityItem };

const REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_DURATION_SECONDS = 30;
const MIN_DURATION_SECONDS = 18;
const SCROLL_SPEED_PX_PER_SECOND = 80;
const MIN_ASSUMED_ENTRY_WIDTH_PX = 120;
const MIN_ASSUMED_CYCLE_WIDTH_PX = 120;
const EXTRA_BUFFER_COPIES = 2;
const FALLBACK_REPEAT_COUNT = 14;
const SEAM_BUFFER_PX = 32;
const ACTION_CHIP_CLASS =
  "rounded-[2px] px-1.5 py-px text-black";

function TickerItems({
  items,
}: {
  items: TradeActivityItem[];
}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.id ?? `${item.trader}-${item.coin}-${index}`}>
          <span className="type-caption inline-flex items-center gap-1.5 px-4 font-mono whitespace-nowrap">
            <span className="text-muted-foreground">{item.trader}</span>
            <span
              className={
                item.action === "bought"
                  ? `${ACTION_CHIP_CLASS} bg-[#3FFF00]`
                  : `${ACTION_CHIP_CLASS} bg-[#FF00F0]`
              }
            >
              {item.action}
            </span>
            <span className="text-foreground">
              {item.amount} {item.coin}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="inline-flex h-full w-3 shrink-0 items-center justify-center self-center"
          >
            <span className="-translate-y-px animate-ticker-cursor block h-3 w-2 bg-foreground/85" />
          </span>
        </Fragment>
      ))}
    </>
  );
}

export function ActivityTickerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-8 items-center overflow-hidden border-y border-border bg-white dark:bg-black"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center">
        <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-4">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span className="type-caption font-mono text-muted-foreground/60">
            Loading
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <div className="h-4 w-32 shrink-0 bg-muted/60" />
          <div className="h-4 w-16 shrink-0 bg-[#3FFF00]/60" />
          <div className="h-4 w-28 shrink-0 bg-muted/60" />
          <div className="h-4 w-14 shrink-0 bg-muted/50" />
        </div>
      </div>
    </div>
  );
}

function TickerStatusMessage({
  tone,
  message,
}: {
  tone: "live" | "muted";
  message: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center px-4">
      <span
        className={
          tone === "live"
            ? "type-caption font-mono text-muted-foreground"
            : "type-caption font-mono text-muted-foreground/80"
        }
      >
        {message}
      </span>
    </div>
  );
}

/**
 * CSS marquee ticker with live activity data from the public API.
 * Animation speed is derived from the measured width of one rendered cycle so
 * the scroll rate stays stable even when trade text lengths change.
 */
export function ActivityTicker({
  initialItems = [],
}: {
  initialItems?: TradeActivityItem[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cycleRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [cycleWidth, setCycleWidth] = useState(0);

  const query = useQuery<ActivityApiResponse, Error>({
    queryKey: ["activity-feed"],
    refetchInterval: REFRESH_INTERVAL_MS,
    ...(initialItems.length > 0
      ? {
          initialData: {
            items: initialItems,
            count: initialItems.length,
          } satisfies ActivityApiResponse,
        }
      : {}),
    queryFn: async () => {
      const response = await fetch("/api/activity?count=6");
      if (!response.ok) {
        throw new Error("Failed to fetch activity feed.");
      }

      return response.json() as Promise<ActivityApiResponse>;
    },
  });

  const liveItems = query.data?.items ?? initialItems;
  const hasLiveItems = liveItems.length > 0;
  const isLoadingItems = !hasLiveItems && query.isPending;
  const isErrorState = !hasLiveItems && query.isError;
  const isEmptyState = !hasLiveItems && !query.isError && query.isFetched;
  const items = useMemo(
    () => (hasLiveItems ? liveItems : []),
    [hasLiveItems, liveItems],
  );

  useLayoutEffect(() => {
    const viewportElement = viewportRef.current;
    const cycleElement = cycleRef.current;

    if (!viewportElement || !cycleElement) {
      return;
    }

    let frameId = 0;

    const measure = () => {
      const nextViewportWidth = viewportElement.getBoundingClientRect().width;
      const nextCycleWidth = cycleElement.getBoundingClientRect().width;

      setViewportWidth((current) =>
        current === nextViewportWidth ? current : nextViewportWidth,
      );
      setCycleWidth((current) =>
        current === nextCycleWidth ? current : nextCycleWidth,
      );
    };

    measure();
    frameId = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    const fontFaceSet = document.fonts;
    fontFaceSet?.addEventListener?.("loadingdone", measure);
    void fontFaceSet?.ready.then(measure);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);

    observer?.observe(viewportElement);
    observer?.observe(cycleElement);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measure);
      fontFaceSet?.removeEventListener?.("loadingdone", measure);
      observer?.disconnect();
    };
  }, [items]);

  const animationDurationSeconds =
    cycleWidth > 0
      ? Math.max(cycleWidth / SCROLL_SPEED_PX_PER_SECOND, MIN_DURATION_SECONDS)
      : DEFAULT_DURATION_SECONDS;
  const minimumCycleWidth =
    items.length > 0
      ? Math.max(items.length * MIN_ASSUMED_ENTRY_WIDTH_PX, MIN_ASSUMED_CYCLE_WIDTH_PX)
      : MIN_ASSUMED_CYCLE_WIDTH_PX;
  const minimumRepeatCount =
    viewportWidth > 0
      ? Math.ceil((viewportWidth + SEAM_BUFFER_PX) / minimumCycleWidth) + EXTRA_BUFFER_COPIES
      : FALLBACK_REPEAT_COUNT;
  const measuredRepeatCount =
    cycleWidth > 0 && viewportWidth > 0
      ? Math.ceil((viewportWidth + cycleWidth + SEAM_BUFFER_PX) / cycleWidth) + 1
      : 0;
  const repeatCount = Math.max(minimumRepeatCount, measuredRepeatCount);
  const canAnimateTicker = items.length > 0;
  const statusLabel = isErrorState ? "Unavailable" : "Live";
  const statusDotClass = isErrorState
    ? "h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
    : "h-1.5 w-1.5 rounded-full bg-[#3FFF00] animate-pulse";

  return (
    <div
      role="log"
      aria-live="off"
      aria-label="Recent agent activity feed"
      className="relative flex h-8 items-center overflow-hidden border-y border-border bg-white dark:bg-black"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center">
        <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-4">
          <span aria-hidden="true" className={statusDotClass} />
          <span className="type-caption font-mono text-muted-foreground">
            {statusLabel}
          </span>
        </div>

        {items.length > 0 ? (
          <div ref={viewportRef} className="flex-1 overflow-hidden">
            <div
              className="ticker-track"
              style={{
                animationDuration: `${animationDurationSeconds}s`,
                animationPlayState: canAnimateTicker ? "running" : "paused",
                ["--ticker-shift" as string]: `-${cycleWidth || viewportWidth || 0}px`,
              }}
            >
              {Array.from({ length: repeatCount }, (_, copyIndex) => (
                <div
                  key={copyIndex}
                  ref={copyIndex === 0 ? cycleRef : undefined}
                  className="flex shrink-0"
                >
                  <TickerItems items={items} />
                </div>
              ))}
            </div>
          </div>
        ) : isLoadingItems ? (
          <TickerStatusMessage tone="live" message="Loading recent trades..." />
        ) : isErrorState ? (
          <TickerStatusMessage
            tone="muted"
            message="Activity feed unavailable right now."
          />
        ) : isEmptyState ? (
          <TickerStatusMessage tone="live" message="No recent trades right now." />
        ) : (
          <TickerStatusMessage tone="live" message="Loading recent trades..." />
        )}
      </div>
    </div>
  );
}
