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
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SortOption)}>
      <TabsList>
        {TAB_DEFS.map((tab) => {
          const Icon = ICON_COMPONENTS[tab.value];
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5"
              onMouseEnter={() => iconRefs[tab.value]?.current?.startAnimation()}
              onMouseLeave={() => iconRefs[tab.value]?.current?.stopAnimation()}
            >
              <span className="hidden sm:inline-flex">
                <Icon size={14} ref={iconRefs[tab.value]} />
              </span>
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {TAB_DEFS.map((tab) => (
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
