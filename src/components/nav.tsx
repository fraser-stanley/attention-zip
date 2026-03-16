"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { skills } from "@/lib/skills";

const sections = [
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    category: "skills",
    description: `${skills.length} skills`,
    items: skills.map((s) => s.name),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    category: "data",
    description: "Live market data",
    items: ["Trending", "Market Cap", "New", "Volume", "Gainers", "Creators"],
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    category: "data",
    description: "Weekly trader rankings",
    items: ["Top traders", "Volume leaders", "Most active"],
  },
  {
    id: "agents",
    label: "Agents",
    href: "/agents",
    category: "data",
    description: "Trader portfolios",
    items: ["Portfolio view", "Holdings breakdown", "Created coins", "Volume rank"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    href: "/portfolio",
    category: "data",
    description: "Your positions & PnL",
    items: ["PnL summary", "Active positions", "Trade history", "Installed skills"],
  },
  {
    id: "trust",
    label: "Trust & Safety",
    href: "/trust",
    category: "info",
    description: "Wallet presets & scope",
    items: ["Wallet presets", "Scope disclaimers", "Verification"],
  },
  {
    id: "about",
    label: "About",
    href: "/",
    category: "info",
    description: "Project info",
    items: ["Open source", "Read-only", "No custody"],
  },
];


export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setHoveredSection(null);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Close overlay on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  const hoveredData = sections.find((s) => s.id === hoveredSection);

  return (
    <>
      {/* Persistent header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm"
        inert={open ? true : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-11 items-center justify-between">
            <Link
              href="/"
              className="font-mono text-sm font-medium tracking-wider uppercase"
            >
              Zora
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="px-3 py-1.5 min-h-[44px] flex items-center text-sm transition-colors bg-foreground text-background hover:bg-background hover:text-foreground border border-transparent hover:border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Index
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen overlay */}
      <div
        inert={!open ? true : undefined}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[100] transition-opacity duration-300 ease-out",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={close} />

        {/* Content */}
        <div
          className={cn(
            "relative h-full flex flex-col text-white transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-4"
          )}
        >
          {/* Overlay header */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-11 items-center justify-between border-b border-white/10">
              <span className="text-sm text-white/40 font-mono">Index</span>
              <button
                onClick={close}
                aria-label="Close navigation"
                className="text-sm px-2 min-h-[44px] flex items-center text-white/40 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Close
              </button>
            </div>
          </div>

          {/* Section grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-white/5">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.href}
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                    onFocus={() => setHoveredSection(section.id)}
                    onBlur={() => setHoveredSection(null)}
                    className={cn(
                      "group bg-black p-6 flex flex-col gap-3 transition-colors duration-150 outline-none",
                      hoveredSection === section.id
                        ? "bg-white text-black"
                        : "hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium uppercase tracking-wider">
                        {section.label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-mono",
                          hoveredSection === section.id
                            ? "text-black/50"
                            : "text-white/30 group-hover:text-black/50"
                        )}
                      >
                        {section.items.length}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs",
                        hoveredSection === section.id
                          ? "text-black/60"
                          : "text-white/50 group-hover:text-black/60"
                      )}
                    >
                      {section.description}
                    </p>
                    <ul className="space-y-1 mt-auto">
                      {section.items.slice(0, 4).map((item) => (
                        <li
                          key={item}
                          className={cn(
                            "text-xs font-mono",
                            hoveredSection === section.id
                              ? "text-black/70"
                              : "text-white/40 group-hover:text-black/70"
                          )}
                        >
                          {item}
                        </li>
                      ))}
                      {section.items.length > 4 && (
                        <li
                          className={cn(
                            "text-xs font-mono",
                            hoveredSection === section.id
                              ? "text-black/40"
                              : "text-white/20 group-hover:text-black/40"
                          )}
                        >
                          +{section.items.length - 4} more
                        </li>
                      )}
                    </ul>
                  </Link>
                ))}
              </div>

              {/* Detail preview */}
              {hoveredData && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-white/50">
                      {hoveredData.label}
                    </span>
                    <span className="text-xs font-mono text-white/30">
                      {hoveredData.items.length} items
                    </span>
                  </div>
                  <div className="grid gap-0 border border-white/10">
                    {hoveredData.items.map((item, i) => (
                      <div
                        key={item}
                        className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-b-0 text-sm"
                      >
                        <span className="text-white/70 font-mono text-xs">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-white/90 text-sm flex-1 ml-4">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay footer */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-8 items-center justify-between border-t border-white/10 text-xs text-white/30 font-mono">
              <span>{sections.length} sections</span>
              <span>Zora Agent Skills</span>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
