import { ActivityTicker } from "@/components/activity-ticker";
import { MOCK_TRADE_ACTIVITY } from "@/lib/activity-mock-data";

export function ActivityTickerSection() {
  return <ActivityTicker initialItems={MOCK_TRADE_ACTIVITY} />;
}
