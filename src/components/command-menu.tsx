"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

import { skills } from "@/lib/skills";
import { cn } from "@/lib/utils";

type SearchItem = {
  id: string;
  title: string;
  breadcrumb: string;
  href: string;
  group: "Pages" | "Skills" | "Dashboard";
  keywords: string[];
  meta?: string;
};

type RecentEntry = {
  id: string;
  query: string;
};

const RECENT_SEARCHES_KEY = "zora:command-menu-recent";
const RECENT_SEARCH_LIMIT = 6;

const pages: SearchItem[] = [
  {
    id: "page-home",
    title: "Home",
    href: "/",
    breadcrumb: "Pages > Home",
    group: "Pages",
    keywords: ["index", "landing", "about"],
  },
  {
    id: "page-dashboard",
    title: "Dashboard",
    href: "/dashboard",
    breadcrumb: "Pages > Dashboard",
    group: "Pages",
    keywords: ["explore", "market", "data", "live"],
  },
  {
    id: "page-skills",
    title: "Skills",
    href: "/skills",
    breadcrumb: "Pages > Skills",
    group: "Pages",
    keywords: ["install", "gallery", "agents"],
  },
  {
    id: "page-leaderboard",
    title: "Leaderboard",
    href: "/leaderboard",
    breadcrumb: "Pages > Leaderboard",
    group: "Pages",
    keywords: ["traders", "rankings", "top"],
  },
  {
    id: "page-portfolio",
    title: "Portfolio",
    href: "/portfolio",
    breadcrumb: "Pages > Portfolio",
    group: "Pages",
    keywords: ["positions", "pnl", "holdings"],
  },
  {
    id: "page-trust",
    title: "Trust & Safety",
    href: "/trust",
    breadcrumb: "Pages > Trust & Safety",
    group: "Pages",
    keywords: ["wallet", "presets", "scope", "security"],
  },
];

const dashboardItems: SearchItem[] = [
  {
    id: "dashboard-trending",
    title: "Trending",
    href: "/dashboard",
    breadcrumb: "Dashboard > Trending",
    group: "Dashboard",
    keywords: ["hot", "popular"],
  },
  {
    id: "dashboard-market-cap",
    title: "Market Cap",
    href: "/dashboard",
    breadcrumb: "Dashboard > Market Cap",
    group: "Dashboard",
    keywords: ["mcap", "valuable"],
  },
  {
    id: "dashboard-new-coins",
    title: "New Coins",
    href: "/dashboard",
    breadcrumb: "Dashboard > New Coins",
    group: "Dashboard",
    keywords: ["launches", "recent"],
  },
  {
    id: "dashboard-volume",
    title: "Volume",
    href: "/dashboard",
    breadcrumb: "Dashboard > Volume",
    group: "Dashboard",
    keywords: ["trading", "24h"],
  },
  {
    id: "dashboard-top-gainers",
    title: "Top Gainers",
    href: "/dashboard",
    breadcrumb: "Dashboard > Top Gainers",
    group: "Dashboard",
    keywords: ["gains", "pumping"],
  },
  {
    id: "dashboard-creators",
    title: "Creators",
    href: "/dashboard",
    breadcrumb: "Dashboard > Creators",
    group: "Dashboard",
    keywords: ["creator", "featured"],
  },
];

const skillItems: SearchItem[] = skills.map((skill) => ({
  id: `skill-${skill.id}`,
  title: skill.name,
  href: `/skills#${skill.id}`,
  breadcrumb: `Skills > ${skill.name} > Install`,
  group: "Skills",
  keywords: [skill.description, skill.riskLabel, ...skill.badges],
  meta: skill.riskLabel.split("—")[0]?.trim() ?? skill.riskLabel,
}));

const searchItems = [...pages, ...skillItems, ...dashboardItems];
const itemById = new Map(searchItems.map((item) => [item.id, item]));

const groupHeadingClass =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground";

const itemClass =
  "group/item cursor-pointer rounded-lg px-3 py-3 text-left outline-none data-[selected=true]:bg-foreground data-[selected=true]:text-background";

function useModKey() {
  const isMac =
    typeof navigator !== "undefined"
      ? navigator.platform?.toUpperCase().includes("MAC") ?? true
      : true;

  return isMac ? "⌘" : "Ctrl+";
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function readRecentEntries() {
  try {
    const raw = window.sessionStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry) =>
            typeof entry?.id === "string" &&
            typeof entry?.query === "string" &&
            itemById.has(entry.id)
        )
      : [];
  } catch {
    return [];
  }
}

function writeRecentEntries(entries: RecentEntry[]) {
  try {
    window.sessionStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(entries.slice(0, RECENT_SEARCH_LIMIT))
    );
  } catch {
    // sessionStorage can be blocked
  }
}

function SearchResultItem({
  item,
  recentQuery,
  onSelect,
}: {
  item: SearchItem;
  recentQuery?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${item.title} ${item.breadcrumb}`}
      keywords={item.keywords}
      onSelect={onSelect}
      className={cn(itemClass, "flex items-start justify-between gap-3")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{item.title}</span>
          {item.meta ? (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-mono text-muted-foreground group-data-[selected=true]/item:border-background/20 group-data-[selected=true]/item:text-background/70">
              {item.meta}
            </span>
          ) : null}
        </div>
        <span className="mt-1 block text-xs text-muted-foreground group-data-[selected=true]/item:text-background/70">
          {item.breadcrumb}
        </span>
      </div>

      {recentQuery ? (
        <span className="shrink-0 text-[11px] font-mono text-muted-foreground group-data-[selected=true]/item:text-background/70">
          “{recentQuery}”
        </span>
      ) : null}
    </Command.Item>
  );
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const router = useRouter();
  const modKey = useModKey();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setRecentEntries(readRecentEntries());
      return;
    }

    setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isEditableTarget(event.target)) {
          return;
        }

        event.preventDefault();
        const nextOpen = !open;
        setOpen(nextOpen);

        if (nextOpen) {
          setRecentEntries(readRecentEntries());
        } else {
          setQuery("");
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function navigate(item: SearchItem) {
    const nextRecentEntries = [
      { id: item.id, query: query.trim() },
      ...recentEntries.filter((entry) => entry.id !== item.id),
    ].slice(0, RECENT_SEARCH_LIMIT);

    writeRecentEntries(nextRecentEntries);
    setRecentEntries(nextRecentEntries);
    setOpen(false);
    setQuery("");

    startTransition(() => {
      router.push(item.href);
    });
  }

  const recentItems =
    query.trim().length === 0
      ? recentEntries
          .map((entry) => {
            const item = itemById.get(entry.id);
            return item ? { item, query: entry.query } : null;
          })
          .filter((entry): entry is { item: SearchItem; query: string } => entry !== null)
      : [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Navigation"
      loop
      overlayClassName="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[16%] z-[150] w-full max-w-xl -translate-x-1/2 overflow-hidden border border-border bg-background shadow-2xl"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search pages, skills, and dashboard views…"
        aria-label="Search commands and pages"
        className="w-full border-b border-border bg-transparent px-4 py-3 text-base font-mono placeholder:text-muted-foreground outline-none"
      />

      <Command.List className="max-h-[26rem] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
          No matches for <span className="font-mono text-foreground">{query}</span>.
        </Command.Empty>

        {recentItems.length > 0 ? (
          <Command.Group heading="Recent" className={groupHeadingClass}>
            {recentItems.map(({ item, query: recentQuery }) => (
              <SearchResultItem
                key={`recent-${item.id}`}
                item={item}
                recentQuery={recentQuery}
                onSelect={() => navigate(item)}
              />
            ))}
          </Command.Group>
        ) : null}

        <Command.Group heading="Pages" className={groupHeadingClass}>
          {pages.map((item) => (
            <SearchResultItem key={item.id} item={item} onSelect={() => navigate(item)} />
          ))}
        </Command.Group>

        <Command.Group heading="Skills" className={groupHeadingClass}>
          {skillItems.map((item) => (
            <SearchResultItem key={item.id} item={item} onSelect={() => navigate(item)} />
          ))}
        </Command.Group>

        <Command.Group heading="Dashboard" className={groupHeadingClass}>
          {dashboardItems.map((item) => (
            <SearchResultItem key={item.id} item={item} onSelect={() => navigate(item)} />
          ))}
        </Command.Group>
      </Command.List>

      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs font-mono text-muted-foreground">
        <span>{modKey}K</span>
        <div className="flex items-center gap-2">
          <kbd className="border border-border px-1.5 py-0.5 text-[11px]">↑↓</kbd>
          <span>select</span>
          <kbd className="border border-border px-1.5 py-0.5 text-[11px]">↵</kbd>
          <span>open</span>
          <kbd className="border border-border px-1.5 py-0.5 text-[11px]">esc</kbd>
          <span>close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
