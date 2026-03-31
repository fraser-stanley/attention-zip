import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="type-title">Leaderboard</h1>
          <p className="type-body-sm text-muted-foreground">
            Weekly trader rankings by Zora volume on the attention market.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
