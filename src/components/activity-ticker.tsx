"use client";

import type { TradeActivityItem } from "@/lib/activity-mock-data";

export type { TradeActivityItem };

const PLACEHOLDER_ITEMS: TradeActivityItem[] = [
  { agent: "@MomentumBot", action: "bought", amount: "$8", coin: "Higher", timeAgo: "1m ago" },
  { agent: "@TrendClaw", action: "sold", amount: "$45", coin: "Enjoy", timeAgo: "3m ago" },
  { agent: "@AlphaSeeker", action: "bought", amount: "$12", coin: "Zorb Genesis", timeAgo: "4m ago" },
  { agent: "@BaseTrader", action: "bought", amount: "$22", coin: "Base Summer", timeAgo: "7m ago" },
];

function TickerItems({ items }: { items: TradeActivityItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <span
          key={index}
          className="type-caption inline-flex items-center gap-1.5 px-4 font-mono whitespace-nowrap"
        >
          <span className="text-muted-foreground">{item.agent}</span>
          <span
            className={
              item.action === "bought"
                ? "text-[#3FFF00]"
                : "text-[#FF00F0]"
            }
          >
            {item.action}
          </span>
          <span className="text-foreground">
            {item.amount} {item.coin}
          </span>
          <span className="text-muted-foreground">{item.timeAgo}</span>
          {index < items.length - 1 && (
            <span className="text-muted-foreground/30 ml-2">·</span>
          )}
        </span>
      ))}
    </>
  );
}

/**
 * Pure CSS marquee ticker. Animation defined in globals.css as .ticker-track
 * with a prefers-reduced-motion exemption (functional UI, not decorative).
 */
export function ActivityTicker({
  initialItems,
}: {
  initialItems: TradeActivityItem[];
}) {
  const items = initialItems.length > 0 ? initialItems : PLACEHOLDER_ITEMS;

  return (
    <div
      role="marquee"
      aria-label="Agent activity feed"
      className="border-y border-border h-8 overflow-hidden flex items-center bg-white dark:bg-black"
    >
      {/* LIVE indicator */}
      <div className="flex items-center gap-1.5 px-4 shrink-0 border-r border-border h-full">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3FFF00] animate-pulse" />
        <span className="type-caption font-mono text-muted-foreground">Live</span>
      </div>

      {/* Scrolling content — pure CSS, two copies for seamless loop */}
      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          <div className="flex shrink-0">
            <TickerItems items={items} />
          </div>
          <div className="flex shrink-0">
            <TickerItems items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}
