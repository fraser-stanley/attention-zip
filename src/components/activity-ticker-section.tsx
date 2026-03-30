import { getActivityFeedData } from "@/lib/data";
import { ActivityTicker } from "@/components/activity-ticker";

export async function ActivityTickerSection() {
  const initialItems = await getActivityFeedData(6);

  return <ActivityTicker initialItems={initialItems} />;
}
