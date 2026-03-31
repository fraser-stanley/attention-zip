"use client";

import dynamic from "next/dynamic";

const HeroOrbGlass = dynamic(
  () => import("@/components/hero-orb-glass").then((mod) => mod.HeroOrbGlass),
  { ssr: false }
);

export function HeroOrbGlassLoader({ spinSignal = 0 }: { spinSignal?: number }) {
  return <HeroOrbGlass spinSignal={spinSignal} />;
}
