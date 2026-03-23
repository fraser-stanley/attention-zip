"use client";

import { Suspense } from "react";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { getInstallAllCommands } from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";
import { HighlighterStroke } from "@/components/highlighter-stroke";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";

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
              command={getInstallAllCommands(getSiteUrl()).claude}
              className="max-w-lg"
            />
            <div className="flex items-center gap-3">
              <AnimatedArrowLink
                href="/skills"
                variant="default"
                className="flex-1 px-8 sm:flex-initial"
              >
                Install skills
              </AnimatedArrowLink>
              <AnimatedArrowLink
                href="/dashboard"
                className="flex-1 sm:flex-initial"
              >
                See the market
              </AnimatedArrowLink>
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

    </section>
  );
}
