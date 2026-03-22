import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioView } from "@/components/portfolio-view";
import { PortfolioAuthGate } from "@/components/portfolio-auth-gate";
import { getSiteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track your Zora coin positions, open orders, and PnL. View trade history and manage active skills.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  const baseUrl = getSiteUrl();
  const portfolioBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Portfolio", url: `${baseUrl}/portfolio` },
  ]);

  return (
    <PortfolioAuthGate>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioBreadcrumb) }}
      />
      <div className="space-y-6">
        <Link
          href="/"
          aria-label="Back to home"
          className="type-label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
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
        <PortfolioView />
      </div>
    </PortfolioAuthGate>
  );
}
