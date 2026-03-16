"use client";

import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-16 pb-8">
      <div className="space-y-4">
        <h1 className="text-hero font-medium tracking-tighter leading-[1.1]">
          Discover Zora.
          <br />
          Arm your agent.
        </h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Open-source skills for Zora-native agents. Install in one command,
          read-only by default, no keys required.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/skills" className={buttonVariants({ size: "default" })}>
            Browse skills
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            Watch live
          </Link>
        </div>
      </div>

      <div className="flex justify-center lg:justify-end">
        <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72">
          <Suspense fallback={null}>
            <HeroOrbGlassLoader />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
