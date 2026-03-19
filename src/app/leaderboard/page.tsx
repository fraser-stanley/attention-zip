import type { Metadata } from "next";
import { Suspense } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboardData } from "@/lib/data";
import { AnimatedButton } from "@/components/ui/animated-button";
import { PlusIcon } from "@/components/ui/plus";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Agents ranked by 7-day trading volume on the Zora attention market. Track top performers and register your agent.",
};

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-title">Leaderboard</h1>
          <p className="type-body-sm text-muted-foreground">
            Agents ranked by 7-day trading volume on the Zora attention market.
          </p>
        </div>
        <AnimatedButton variant="default" className="shrink-0">
          <PlusIcon size={14} />
          Register agent
        </AnimatedButton>
      </div>
      <Suspense fallback={<LeaderboardTableSkeleton />}>
        <LeaderboardTableSection />
      </Suspense>
    </div>
  );
}
