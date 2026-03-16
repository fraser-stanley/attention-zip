"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { skills } from "@/lib/skills";

const pages = [
  { label: "Home", href: "/", keywords: ["index", "landing"] },
  { label: "Dashboard", href: "/dashboard", keywords: ["explore", "market", "data", "live"] },
  { label: "Skills", href: "/skills", keywords: ["install", "gallery", "agents"] },
  { label: "Leaderboard", href: "/leaderboard", keywords: ["traders", "rankings", "top"] },
  { label: "Trust & Safety", href: "/trust", keywords: ["wallet", "presets", "scope", "security"] },
];

const dashboardTabs = [
  { label: "Trending", keywords: ["hot", "popular"] },
  { label: "Market Cap", keywords: ["mcap", "valuable"] },
  { label: "New Coins", keywords: ["launches", "recent"] },
  { label: "Volume", keywords: ["trading", "24h"] },
  { label: "Top Gainers", keywords: ["gains", "pumping"] },
  { label: "Creators", keywords: ["creator", "featured"] },
];

const groupHeadingClass =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground";

const itemClass =
  "px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-foreground data-[selected=true]:text-background";

function useModKey() {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes("MAC") ?? true);
  }, []);
  return isMac ? "⌘" : "Ctrl+";
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const modKey = useModKey();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Navigation"
      loop
      overlayClassName="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
      contentClassName="fixed top-[20%] left-1/2 z-[150] w-full max-w-lg -translate-x-1/2 border border-border bg-background shadow-2xl"
    >
      <Command.Input
        placeholder="Type a command or search…"
        aria-label="Search commands and pages"
        className="w-full border-b border-border bg-transparent px-4 py-3 text-base font-mono placeholder:text-muted-foreground outline-none"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>

        <Command.Group heading="Pages" className={groupHeadingClass}>
          {pages.map((page) => (
            <Command.Item
              key={page.href}
              value={page.label}
              keywords={page.keywords}
              onSelect={() => navigate(page.href)}
              className={itemClass}
            >
              {page.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Skills" className={groupHeadingClass}>
          {skills.map((skill) => (
            <Command.Item
              key={skill.id}
              value={skill.name}
              keywords={[skill.description, ...skill.badges]}
              onSelect={() => navigate(`/skills#${skill.id}`)}
              className={`flex items-center justify-between ${itemClass}`}
            >
              <span>{skill.name}</span>
              <span className="text-xs text-muted-foreground data-[selected=true]:text-background/60 font-mono">
                {skill.riskLabel.split("—")[0]?.trim()}
              </span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Dashboard" className={groupHeadingClass}>
          {dashboardTabs.map((tab) => (
            <Command.Item
              key={tab.label}
              value={tab.label}
              keywords={tab.keywords}
              onSelect={() => navigate(`/dashboard`)}
              className={itemClass}
            >
              {tab.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>

      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{modKey}K</span>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 border border-border text-[11px]">↑↓</kbd>
          <span>select</span>
          <kbd className="px-1.5 py-0.5 border border-border text-[11px]">↵</kbd>
          <span>open</span>
          <kbd className="px-1.5 py-0.5 border border-border text-[11px]">esc</kbd>
          <span>close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
