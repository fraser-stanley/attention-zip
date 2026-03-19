"use client";

import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { HighlighterStroke } from "@/components/highlighter-stroke";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";
import { ActivityTickerSection } from "@/components/activity-ticker-section";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="space-y-6 pt-1 pb-8 sm:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="contents lg:block lg:space-y-5">
          <h1 id="hero-heading" className="type-display order-1 lg:order-none">
            <HighlighterStroke>Attention moves fast.</HighlighterStroke>
            <br />
            Your agent keeps up.
          </h1>
          {/* On mobile, orb slot is order-2 (injected below) */}
          <div className="order-3 space-y-5 lg:order-none">
            <p className="type-body-sm max-w-md text-muted-foreground">
              Open-source skills for the Zora attention market, from trending coins
              to execution. One command to install, read-only by default.
            </p>
            <CopyableCodeBlock
              command="install skill from https://skills.zora.co/api/skills?id=trend-scout"
              className="max-w-lg"
            />
            <div className="flex items-center gap-3">
              <Link
                href="/skills"
                className={cn(buttonVariants({ size: "default" }), "flex-1 px-8 sm:flex-initial")}
              >
                Browse skills
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "default" }), "flex-1 sm:flex-initial")}
              >
                Live data
              </Link>
            </div>
          </div>
        </div>

        <div className="order-2 flex justify-center lg:order-none lg:justify-end">
          <div aria-hidden="true" className="w-56 h-56 sm:w-56 sm:h-56 lg:w-72 lg:h-72">
            <Suspense fallback={null}>
              <HeroOrbGlassLoader />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ActivityTickerSection />
      </div>
    </section>
  );
}
