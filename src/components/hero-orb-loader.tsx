"use client";

import dynamic from "next/dynamic";

const HeroOrb = dynamic(
  () => import("@/components/hero-orb").then((mod) => mod.HeroOrb),
  { ssr: false }
);

export function HeroOrbLoader() {
  return <HeroOrb />;
}
