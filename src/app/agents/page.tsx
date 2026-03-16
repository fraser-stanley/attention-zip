import { Suspense } from "react";
import { AgentListTable } from "@/components/agent-list-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboardData } from "@/lib/data";

async function AgentListSection() {
  const traders = await getLeaderboardData(20);
  return <AgentListTable initialTraders={traders} />;
}

function AgentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground">
          Top Zora traders. Click to view portfolio.
        </p>
      </div>
      <Suspense fallback={<AgentListSkeleton />}>
        <AgentListSection />
      </Suspense>
    </div>
  );
}
