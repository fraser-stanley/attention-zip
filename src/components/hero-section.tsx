"use client";

import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { HighlighterStroke } from "@/components/highlighter-stroke";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4 pb-8">
      <div className="space-y-5">
        <h1 id="hero-heading" className="type-display">
          <HighlighterStroke>Attention moves fast.</HighlighterStroke>
          <br />
          Your agent keeps up.
        </h1>
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
            className={cn(buttonVariants({ size: "default" }), "px-8")}
          >
            Browse skills
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            Live data
          </Link>
        </div>
      </div>

      <div className="flex justify-center lg:justify-end">
        <div aria-hidden="true" className="w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72">
          <Suspense fallback={null}>
            <HeroOrbGlassLoader />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
