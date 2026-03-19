import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getExploreData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Live Zora market data. Trending coins, top gainers, volume leaders, and featured creators refreshed every 30 seconds.",
};

async function DashboardTabsSection() {
  const initialTrendingCoins = await getExploreData("trending", 20);
  return <DashboardTabs initialTrendingCoins={initialTrendingCoins} />;
}

function DashboardTabsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <div className="space-y-2 py-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-title">Live Dashboard</h1>
        <p className="type-body-sm text-muted-foreground">
          Zora market data, refreshed every 30 seconds.
        </p>
      </div>
      <Suspense fallback={<DashboardTabsSkeleton />}>
        <DashboardTabsSection />
      </Suspense>
    </div>
  );
}
