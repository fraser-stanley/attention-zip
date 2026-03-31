"use client";

import { Suspense } from "react";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { getInstallAllCommands } from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="space-y-6 pt-1 pb-8 sm:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="contents lg:block lg:space-y-5">
          <h1 id="hero-heading" className="type-display order-1 lg:order-none">
            Agent skills for the Zora attention market.
          </h1>
          {/* On mobile, orb slot is order-2 (injected below) */}
          <div className="order-3 space-y-5 lg:order-none">
            <div className="max-w-lg space-y-3">
              <p className="type-body-sm text-muted-foreground">
                Give this to your agent.
              </p>
              <CopyableCodeBlock
                command={getInstallAllCommands(getSiteUrl()).prompt}
                prefix=">"
              />
            </div>
            <div className="flex items-center gap-3">
              <AnimatedArrowLink
                href="/skills"
                variant="default"
                className="w-full px-8 sm:w-auto"
              >
                Browse skills
              </AnimatedArrowLink>
            </div>
          </div>
        </div>

        <div className="order-2 flex justify-center lg:order-none lg:justify-end">
          <div aria-hidden="true" className="w-64 h-64 sm:w-72 sm:h-72 lg:w-96 lg:h-96">
            <Suspense fallback={null}>
              <HeroOrbGlassLoader />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
