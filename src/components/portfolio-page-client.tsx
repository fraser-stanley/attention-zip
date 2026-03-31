"use client";

import { PortfolioView } from "@/components/portfolio-view";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { useWallet } from "@/lib/wallet-context";

export function PortfolioPageClient() {
  const { address, hydrated } = useWallet();

  if (!hydrated) {
    return (
      <div className="border border-border bg-card px-4 py-12 text-center">
        <BrailleSpinner className="text-lg text-muted-foreground" />
      </div>
    );
  }

  if (!address) {
    return null;
  }

  return <PortfolioView address={address} />;
}
