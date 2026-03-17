"use client";

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

/**
 * Pure CSS marquee ticker. Animation defined in globals.css as .ticker-track
 * with a prefers-reduced-motion exemption (functional UI, not decorative).
 */
export function ActivityTicker({
  initialItems,
}: {
  initialItems: ActivityItem[];
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
        <span className="font-mono text-xs text-muted-foreground">Live</span>
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
