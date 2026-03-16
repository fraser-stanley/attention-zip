import { Suspense } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboardData } from "@/lib/data";

async function LeaderboardTableSection() {
  const traders = await getLeaderboardData(20);
  return <LeaderboardTable initialTraders={traders} count={20} />;
}

function LeaderboardTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Top Zora traders this week. Data from Zora&apos;s weekly trader
          leaderboard.
        </p>
      </div>
      <Suspense fallback={<LeaderboardTableSkeleton />}>
        <LeaderboardTableSection />
      </Suspense>
    </div>
  );
}
