"use client";

import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { getInstallAllCommands } from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="space-y-5 pt-1 pb-8 sm:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
        <div className="space-y-5">
          <h1 id="hero-heading" className="type-display">
            Agent skills for Zora Attention Markets.
          </h1>
          <div className="space-y-3">
            <p className="type-body-sm font-medium text-muted-foreground">
              Give this to your agent.
            </p>
            <CopyableCodeBlock
              command={getInstallAllCommands(getSiteUrl()).prompt}
              highlight={false}
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
        {/* Right column: zorb from layout overlays here */}
      </div>
    </section>
  );
}
