"use client";

import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useTickerWidth } from "@/hooks/use-ticker-width";
import type { TradeActivityItem } from "@/lib/activity-mock-data";
import { type ActivityApiResponse } from "@/lib/zora";

export type { TradeActivityItem };

const REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_DURATION_SECONDS = 30;
const MIN_DURATION_SECONDS = 18;
const SCROLL_SPEED_PX_PER_SECOND = 80;
const ACTION_CHIP_CLASS =
  "rounded-[2px] px-1.5 py-px text-black";

function getMeasurementText(item: TradeActivityItem): string {
  return `${item.trader}${item.action}${item.amount} ${item.coin}`;
}

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
          {index < items.length - 1 ? (
            <span
              aria-hidden="true"
              className="inline-flex h-full w-3 shrink-0 items-center justify-center self-center"
            >
              <span className="-translate-y-px block h-3 w-2 bg-foreground/85" />
            </span>
          ) : null}
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
 * Animation speed is derived from precomputed content width so the scroll rate
 * stays stable even when trade text lengths change.
 */
export function ActivityTicker({
  initialItems = [],
}: {
  initialItems?: TradeActivityItem[];
}) {
  const fontProbeRef = useRef<HTMLSpanElement | null>(null);
  const [font, setFont] = useState("");

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

  useEffect(() => {
    let frameId = 0;

    const updateFont = () => {
      const element = fontProbeRef.current;
      if (!element) return;

      const nextFont = window.getComputedStyle(element).font;
      setFont((currentFont) => (currentFont === nextFont ? currentFont : nextFont));
    };

    frameId = window.requestAnimationFrame(updateFont);
    window.addEventListener("resize", updateFont);

    const fontFaceSet = document.fonts;
    fontFaceSet?.addEventListener?.("loadingdone", updateFont);
    void fontFaceSet?.ready.then(updateFont);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateFont);
      fontFaceSet?.removeEventListener?.("loadingdone", updateFont);
    };
  }, []);

  const liveItems = query.data?.items ?? initialItems;
  const hasLiveItems = liveItems.length > 0;
  const isLoadingItems = !hasLiveItems && query.isPending;
  const isErrorState = !hasLiveItems && query.isError;
  const isEmptyState = !hasLiveItems && !query.isError && query.isFetched;
  const items = useMemo(
    () => (hasLiveItems ? liveItems : []),
    [hasLiveItems, liveItems],
  );

  const measurementItems = useMemo(
    () => items.map((item) => getMeasurementText(item)),
    [items],
  );
  const contentWidth = useTickerWidth(measurementItems, font);
  const animationDurationSeconds =
    contentWidth > 0
      ? Math.max(contentWidth / SCROLL_SPEED_PX_PER_SECOND, MIN_DURATION_SECONDS)
      : DEFAULT_DURATION_SECONDS;
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
      <span
        ref={fontProbeRef}
        aria-hidden="true"
        className="type-caption pointer-events-none absolute -left-full top-0 font-mono opacity-0"
      >
        {items[0]?.trader ?? "@"}
      </span>

      <div className="mx-auto flex h-full w-full max-w-7xl items-center">
        <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-4">
          <span aria-hidden="true" className={statusDotClass} />
          <span className="type-caption font-mono text-muted-foreground">
            {statusLabel}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <div
              className="ticker-track"
              style={{
                animationDuration: `${animationDurationSeconds}s`,
                animationPlayState: canAnimateTicker ? "running" : "paused",
              }}
            >
              <div className="flex shrink-0">
                <TickerItems items={items} />
              </div>
              <div className="flex shrink-0">
                <TickerItems items={items} />
              </div>
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
