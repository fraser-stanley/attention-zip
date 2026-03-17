"use client";

import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4 pb-8">
      <div className="space-y-4">
        <h1 className="text-hero font-medium tracking-tighter leading-[1.1]">
          Give your agent
          <br />
          the Zora playbook.
        </h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Open-source skills for the Zora attention market. One command
          to install. Read-only by default, no keys needed.
        </p>
        <Link
          href="/skills"
          className={cn(buttonVariants({ size: "default" }), "px-8")}
        >
          Get started
        </Link>
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
