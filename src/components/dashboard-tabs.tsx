"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CoinTable } from "@/components/coin-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoinNode, SortOption } from "@/lib/zora";
import { FlameIcon } from "@/components/ui/flame";
import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { SparklesIcon } from "@/components/ui/sparkles";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import { UserIcon } from "@/components/ui/user";

const tabs: { value: SortOption; label: string; icon: ReactNode }[] = [
  { value: "trending", label: "Trending", icon: <FlameIcon size={14} /> },
  { value: "mcap", label: "Market Cap", icon: <ChartBarIncreasingIcon size={14} /> },
  { value: "new", label: "New", icon: <SparklesIcon size={14} /> },
  { value: "volume", label: "Volume", icon: <ChartBarIncreasingIcon size={14} /> },
  { value: "gainers", label: "Gainers", icon: <TrendingUpIcon size={14} /> },
  { value: "creators", label: "Creator Coins", icon: <UserIcon size={14} /> },
];

export function DashboardTabs({
  initialTrendingCoins,
}: {
  initialTrendingCoins: CoinNode[];
}) {
  const [activeTab, setActiveTab] = useState<SortOption>("trending");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SortOption)}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
            <span className="hidden sm:inline-flex">{tab.icon}</span>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {activeTab === tab.value && (
            <CoinTable
              sort={tab.value}
              count={20}
              initialCoins={
                tab.value === "trending" ? initialTrendingCoins : undefined
              }
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
