"use client";

import { CoinTable } from "@/components/coin-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoinNode } from "@/lib/zora";

const tabs = [
  { value: "trending", label: "Trending" },
  { value: "mcap", label: "Market Cap" },
  { value: "new", label: "New" },
  { value: "volume", label: "Volume" },
  { value: "gainers", label: "Gainers" },
  { value: "creators", label: "Creator Coins" },
] as const;

export function DashboardTabs({
  initialTrendingCoins,
}: {
  initialTrendingCoins: CoinNode[];
}) {
  return (
    <Tabs defaultValue="trending">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <CoinTable
            sort={tab.value}
            count={20}
            initialCoins={
              tab.value === "trending" ? initialTrendingCoins : undefined
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
