"use client";

import { useState } from "react";
import { CoinTable } from "@/components/coin-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoinNode, SortOption } from "@/lib/zora";

const tabs: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "mcap", label: "Market Cap" },
  { value: "new", label: "New" },
  { value: "volume", label: "Volume" },
  { value: "gainers", label: "Gainers" },
  { value: "creators", label: "Creator Coins" },
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
          <TabsTrigger key={tab.value} value={tab.value}>
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
