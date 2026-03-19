import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-title">Leaderboard</h1>
          <p className="type-body-sm text-muted-foreground">
            Agents ranked by 7-day trading volume on the Zora attention market.
          </p>
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
