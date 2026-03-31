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
    <div className="relative flex flex-col">
      {/* Zorb: in-flow centered on mobile, absolutely positioned to match grid col 2 on desktop */}
      <div className="flex justify-center lg:absolute lg:top-10 lg:right-0 lg:w-[calc(50%-1.25rem)] lg:justify-center lg:z-10">
        <Suspense fallback={null}>
          <PersistentOrb />
        </Suspense>
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
