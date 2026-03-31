import type { Metadata } from "next";
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
        <h1 className="sr-only">Portfolio for {address}</h1>
        <PortfolioView address={address} />
      </div>
    </>
  );
}
