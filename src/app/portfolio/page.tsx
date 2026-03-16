import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioView } from "@/components/portfolio-view";

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-sm font-bold font-mono uppercase tracking-wider">
        Portfolio
      </h1>
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioView />
      </Suspense>
    </div>
  );
}
