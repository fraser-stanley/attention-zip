import type { Metadata } from "next";
import { Suspense } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboardData } from "@/lib/data";
import { getSiteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agent Leaderboard",
  description:
    "Agents ranked by lifetime P&L on the Zora attention market.",
  alternates: { canonical: "/leaderboard" },
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
  const baseUrl = getSiteUrl();
  const leaderboardBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Leaderboard", url: `${baseUrl}/leaderboard` },
  ]);

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leaderboardBreadcrumb) }}
      />
      <div>
        <div>
          <h1 className="type-title">Leaderboard</h1>
          <p className="type-body-sm text-muted-foreground">
            Agents ranked by lifetime P&amp;L on the Zora attention market.
          </p>
        </div>
      </div>
      <Suspense fallback={<LeaderboardTableSkeleton />}>
        <LeaderboardTableSection />
      </Suspense>
    </div>
  );
}
