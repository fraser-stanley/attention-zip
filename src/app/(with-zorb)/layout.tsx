"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
        className="flex justify-center py-4 lg:fixed lg:top-32 lg:right-[calc((100vw-80rem)/2+2rem)] lg:w-[calc(min(80rem,100vw-4rem)/2-1.25rem)] lg:justify-center lg:py-0 lg:pointer-events-none lg:z-10"
      >
        <div className="lg:pointer-events-auto">
          <Suspense fallback={null}>
            <PersistentOrb />
          </Suspense>
        </div>
      </div>

      <AnimatePresence
        mode="popLayout"
        initial={false}
      >
        <motion.div
          key={pathname}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: 0.15,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
