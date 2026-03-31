import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioView } from "@/components/portfolio-view";
import { breadcrumbJsonLd, getSiteUrl } from "@/lib/site";
import { isWalletAddress } from "@/lib/wallet-address";
import { truncateAddress } from "@/lib/zora";

interface PortfolioAddressPageProps {
  params: Promise<{
    address: string;
  }>;
}

export async function generateMetadata({
  params,
}: PortfolioAddressPageProps): Promise<Metadata> {
  const { address } = await params;

  if (!isWalletAddress(address)) {
    return {
      title: "Portfolio",
      description: "Track Zora coin positions by wallet address.",
    };
  }

  return {
    title: `Portfolio ${truncateAddress(address)}`,
    description: `Track Zora coin positions for ${address}.`,
    alternates: {
      canonical: `/portfolio/${address}`,
    },
  };
}

export default async function PortfolioAddressPage({
  params,
}: PortfolioAddressPageProps) {
  const { address } = await params;

  if (!isWalletAddress(address)) {
    notFound();
  }

  const baseUrl = getSiteUrl();
  const portfolioBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Portfolio", url: `${baseUrl}/portfolio` },
    { name: truncateAddress(address), url: `${baseUrl}/portfolio/${address}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioBreadcrumb) }}
      />

      <div className="space-y-6">
        <Link
          href="/portfolio"
          aria-label="Back to portfolio"
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
            <path
              d="M6 3L2 7L6 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        <h1 className="sr-only">Portfolio for {address}</h1>
        <PortfolioView address={address} />
      </div>
    </>
  );
}
