"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinTable } from "@/components/coin-table";

const tabs = [
  { value: "trending", label: "Trending" },
  { value: "mcap", label: "Market Cap" },
  { value: "new", label: "New" },
  { value: "volume", label: "Volume" },
  { value: "gainers", label: "Gainers" },
  { value: "creators", label: "Creator Coins" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time Zora market data. Refreshes every 30 seconds.
        </p>
      </div>

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
            <CoinTable sort={tab.value} count={20} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
