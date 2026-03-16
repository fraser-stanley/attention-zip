import { Suspense } from "react";
import { ActivityTicker, type ActivityItem } from "@/components/activity-ticker";
import { getExploreData } from "@/lib/data";
import { formatCompactCurrency, formatChange, type CoinNode } from "@/lib/zora";

function coinToItem(coin: CoinNode, type: "trending" | "gainers" | "new"): ActivityItem {
  const value = formatCompactCurrency(coin.marketCap);
  if (type === "trending") {
    return { name: coin.name ?? "Unknown", tag: "trending", value, positive: null };
  }
  if (type === "new") {
    return { name: coin.name ?? "Unknown", tag: "new launch", value, positive: null };
  }
  const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
  return { name: coin.name ?? "Unknown", tag: change.value, value, positive: change.positive };
}

async function TickerData() {
  const [trending, gainers, newCoins] = await Promise.all([
    getExploreData("trending", 5),
    getExploreData("gainers", 5),
    getExploreData("new", 5),
  ]);

  const maxLen = Math.max(trending.length, gainers.length, newCoins.length);
  const items: ActivityItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < trending.length) items.push(coinToItem(trending[i], "trending"));
    if (i < gainers.length) items.push(coinToItem(gainers[i], "gainers"));
    if (i < newCoins.length) items.push(coinToItem(newCoins[i], "new"));
  }

  return <ActivityTicker initialItems={items} />;
}

export function ActivityTickerSection() {
  return (
    <Suspense fallback={null}>
      <TickerData />
    </Suspense>
  );
}
