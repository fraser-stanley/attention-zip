import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AgentProfileDetail } from "@/components/agent-profile-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentProfileData } from "@/lib/data";

function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

async function AgentProfileSection({ address }: { address: string }) {
  const data = await getAgentProfileData(address);
  return <AgentProfileDetail address={address} initialProfile={data} />;
}

function AgentProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  if (!isValidAddress(address)) {
    notFound();
  }

  return (
    <Suspense fallback={<AgentProfileSkeleton />}>
      <AgentProfileSection address={address} />
    </Suspense>
  );
}
