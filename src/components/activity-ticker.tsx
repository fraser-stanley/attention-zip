"use client";

export interface ActivityItem {
  name: string;
  tag: string;
  value: string;
  positive: boolean | null;
}

export function ActivityTicker({
  initialItems,
}: {
  initialItems: ActivityItem[];
}) {
  if (initialItems.length === 0) return null;

  const duration = `${Math.max(initialItems.length * 2, 15)}s`;

  return (
    <div
      role="marquee"
      aria-label="Agent activity feed"
      className="border-y border-border h-8 overflow-hidden flex items-center"
    >
      {/* LIVE indicator */}
      <div className="flex items-center gap-1.5 px-4 shrink-0 border-r border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3FFF00] animate-pulse" />
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* Scrolling content */}
      <div className="overflow-hidden flex-1">
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: `marquee ${duration} linear infinite`,
          }}
        >
          {/* Duplicate for seamless loop */}
          {[0, 1].map((pass) => (
            <div key={pass} className="flex items-center shrink-0">
              {initialItems.map((item, index) => (
                <div
                  key={`${pass}-${index}`}
                  className="flex items-center gap-1.5 px-4 font-mono text-xs"
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
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
