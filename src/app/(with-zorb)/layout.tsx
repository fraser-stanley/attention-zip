"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { PersistentOrb } from "@/components/persistent-orb";

export default function WithZorbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative">
      {/* Zorb: in-flow on mobile, fixed to hero content area on desktop */}
      <div
        aria-hidden="true"
        className="flex justify-center py-4 lg:absolute lg:top-32 lg:right-0 lg:w-[calc(min(80rem,100vw-4rem)/2-1.25rem)] lg:justify-center lg:py-0 lg:pointer-events-none lg:z-10"
      >
        <div className="lg:pointer-events-auto">
          <Suspense fallback={null}>
            <PersistentOrb />
          </Suspense>
        </div>
      </div>

      <motion.div
        key={pathname}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.15,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
