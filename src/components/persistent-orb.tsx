"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HeroOrbGlassLoader } from "@/components/hero-orb-glass-loader";

export function PersistentOrb() {
  const pathname = useRef(usePathname());
  const [spinSignal, setSpinSignal] = useState(0);

  const spin = useCallback(() => {
    setSpinSignal((n) => n + 1);
  }, []);

  // Spin immediately on any internal link click (before routing starts)
  useEffect(() => {
    function handleMouseDown(e: MouseEvent | TouchEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("//")) return;

      // Internal link to a different page — spin on press, before routing
      if (href !== pathname.current) {
        pathname.current = href;
        spin();
      }
    }

    document.addEventListener("mousedown", handleMouseDown, { capture: true });
    document.addEventListener("touchstart", handleMouseDown, { capture: true });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
      document.removeEventListener("touchstart", handleMouseDown, { capture: true });
    };
  }, [spin]);

  return (
    <div
      aria-hidden="true"
      className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80"
    >
      <HeroOrbGlassLoader spinSignal={spinSignal} />
    </div>
  );
}
