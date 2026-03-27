"use client";

import { AddressConnectForm } from "@/components/address-connect-form";
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
    return (
      <div className="space-y-6 border border-border bg-card p-5 sm:p-6">
        <div className="space-y-2">
          <p className="type-label text-muted-foreground">Portfolio</p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            Look up your Zora coin positions by address
          </h2>
          <p className="type-body-sm max-w-2xl text-muted-foreground">
            Portfolio data is public. Paste the address from your local Zora CLI wallet to load
            holdings and market value.
          </p>
        </div>

        <AddressConnectForm
          autoFocus
          description="The address is stored locally in your browser so the portfolio page stays unlocked."
          submitLabel="Load portfolio"
        />
      </div>
    );
  }

  return <PortfolioView address={address} />;
}
