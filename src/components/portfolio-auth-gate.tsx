"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";

export function PortfolioAuthGate({ children }: { children: React.ReactNode }) {
  const { isConnected, hydrated } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isConnected) {
      router.replace("/");
    }
  }, [hydrated, isConnected, router]);

  if (!hydrated || !isConnected) return null;

  return children;
}
