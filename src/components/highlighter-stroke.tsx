"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

export function HighlighterStroke({ children }: { children: ReactNode }) {
  return (
    <motion.span
      className="highlight-block"
      initial={{ backgroundSize: "0% 100%", scaleY: 0.88, skewX: "-1.5deg" }}
      animate={{ backgroundSize: "100% 100%", scaleY: 1, skewX: "-1.5deg" }}
      transition={{
        backgroundSize: {
          duration: 0.35,
          delay: 0.15,
          ease: EASE_OUT_QUINT,
        },
        scaleY: {
          duration: 0.2,
          delay: 0.1,
          ease: EASE_OUT_QUINT,
        },
      }}
      style={{
        backgroundColor: "transparent",
        backgroundImage: "linear-gradient(#3FFF00, #3FFF00)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left",
        transformOrigin: "left bottom",
      }}
    >
      {children}
    </motion.span>
  );
}
