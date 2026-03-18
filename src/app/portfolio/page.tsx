import { Suspense } from "react";
import Link from "next/link";
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
      <Link
        href="/"
        aria-label="Back to home"
        className="type-body-sm inline-flex items-center gap-2 font-mono uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 7H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 3L2 7L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>
      <h1 className="sr-only">Portfolio</h1>
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioView />
      </Suspense>
    </div>
  );
}
