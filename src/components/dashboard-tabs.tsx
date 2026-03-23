"use client";

import { useMemo, useState, createRef } from "react";
import { CoinTable } from "@/components/coin-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoinNode, SortOption } from "@/lib/zora";
import { FlameIcon, type FlameIconHandle } from "@/components/ui/flame";
import { ChartBarIncreasingIcon, type ChartBarIncreasingIconHandle } from "@/components/ui/chart-bar-increasing";
import { SparklesIcon, type SparklesIconHandle } from "@/components/ui/sparkles";
import { TrendingUpIcon, type TrendingUpIconHandle } from "@/components/ui/trending-up";
import { UserIcon, type UserIconHandle } from "@/components/ui/user";

type IconHandle = FlameIconHandle | ChartBarIncreasingIconHandle | SparklesIconHandle | TrendingUpIconHandle | UserIconHandle;

const TAB_DEFS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "mcap", label: "Market Cap" },
  { value: "new", label: "New" },
  { value: "volume", label: "Volume" },
  { value: "gainers", label: "Gainers" },
  { value: "creators", label: "Creator Coins" },
];

const ICON_COMPONENTS: Record<SortOption, React.ComponentType<{ size?: number; ref?: React.Ref<IconHandle> }>> = {
  trending: FlameIcon,
  mcap: ChartBarIncreasingIcon,
  new: SparklesIcon,
  volume: ChartBarIncreasingIcon,
  gainers: TrendingUpIcon,
  creators: UserIcon,
  featured: SparklesIcon,
  "last-traded": FlameIcon,
  "last-traded-unique": FlameIcon,
};

export function DashboardTabs({
  initialTrendingCoins,
}: {
  initialTrendingCoins: CoinNode[];
}) {
  const [activeTab, setActiveTab] = useState<SortOption>("trending");
  const iconRefs = useMemo(
    () =>
    Object.fromEntries(TAB_DEFS.map((t) => [t.value, createRef<IconHandle>()])) as Record<SortOption, React.RefObject<IconHandle | null>>
    ,
    []
  );

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SortOption)} className="gap-0">
      <div className="overflow-hidden border border-border bg-card">
        <div className="border-b border-border bg-muted p-1">
          <TabsList
            className="grid w-full grid-cols-3 bg-transparent p-0 sm:w-auto sm:grid-cols-6"
          >
            {TAB_DEFS.map((tab) => {
              const Icon = ICON_COMPONENTS[tab.value];
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1"
                  onMouseEnter={() => iconRefs[tab.value]?.current?.startAnimation()}
                  onMouseLeave={() => iconRefs[tab.value]?.current?.stopAnimation()}
                >
                  <span className="hidden sm:inline-flex">
                    <Icon size={12} ref={iconRefs[tab.value]} />
                  </span>
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TAB_DEFS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="m-0">
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
      </div>
    </Tabs>
  );
}
