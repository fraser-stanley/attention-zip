"use client";

import { useEffect, useRef, useState } from "react";

export interface ActivityItem {
  name: string;
  tag: string;
  value: string;
  positive: boolean | null;
}

const PLACEHOLDER_ITEMS: ActivityItem[] = [
  { name: "Base Summer", tag: "trending", value: "$52.4M", positive: null },
  { name: "Zorb Genesis", tag: "+24.5%", value: "$31.2M", positive: true },
  { name: "Onchain Radio", tag: "new launch", value: "$14.8M", positive: null },
  { name: "degen.eth", tag: "+8.2%", value: "$9.5M", positive: true },
  { name: "Higher", tag: "trending", value: "$1.9M", positive: null },
  { name: "Enjoy", tag: "-6.3%", value: "$1.4M", positive: false },
  { name: "Mint Monday", tag: "new launch", value: "$3.1M", positive: null },
  { name: "Purple Collective", tag: "+7.1%", value: "$4.8M", positive: true },
];

function TickerItems({ items }: { items: ActivityItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1.5 px-4 font-mono text-xs whitespace-nowrap"
        >
          <span className="text-foreground">{item.name}</span>
          <span
            className={
              item.positive === true
                ? "text-[#3FFF00]"
                : item.positive === false
                  ? "text-[#FF00F0]"
                  : "text-muted-foreground"
            }
          >
            {item.tag}
          </span>
          <span className="text-muted-foreground">{item.value}</span>
        </span>
      ))}
    </>
  );
}

export function ActivityTicker({
  initialItems,
}: {
  initialItems: ActivityItem[];
}) {
  const items = initialItems.length > 0 ? initialItems : PLACEHOLDER_ITEMS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Measure the width of one set of items (half the total content)
    setScrollWidth(el.scrollWidth / 2);
  }, [items]);

  // Speed: ~50px/s for smooth, visible movement
  const duration = scrollWidth > 0 ? scrollWidth / 50 : 20;

  return (
    <div
      role="marquee"
      aria-label="Agent activity feed"
      className="border-y border-border h-8 overflow-hidden flex items-center bg-background"
    >
      {/* LIVE indicator */}
      <div className="flex items-center gap-1.5 px-4 shrink-0 border-r border-border h-full">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3FFF00] animate-pulse" />
        <span className="font-mono text-xs text-muted-foreground">Live</span>
      </div>

      {/* Scrolling content */}
      <div className="overflow-hidden flex-1 relative">
        <div
          ref={scrollRef}
          className="inline-flex whitespace-nowrap"
          style={{
            animation: scrollWidth > 0 ? `marquee ${duration}s linear infinite` : "none",
          }}
        >
          <TickerItems items={items} />
          <TickerItems items={items} />
        </div>
      </div>
    </div>
  );
}
