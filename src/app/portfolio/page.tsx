import type { Metadata } from "next";
import { PortfolioPageClient } from "@/components/portfolio-page-client";
import { breadcrumbJsonLd, getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track your Zora coin positions by address. View current holdings, total value, and related skills.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  const baseUrl = getSiteUrl();
  const portfolioBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Portfolio", url: `${baseUrl}/portfolio` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioBreadcrumb) }}
      />

      <div className="space-y-6">
        <h1 className="sr-only">Portfolio</h1>
        <PortfolioPageClient />
      </div>
    </>
  );
}
