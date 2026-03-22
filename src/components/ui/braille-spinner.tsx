"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import spinners from "unicode-animations";
import type { BrailleSpinnerName } from "unicode-animations";
import { cn } from "@/lib/utils";

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return false;
}

export function BrailleSpinner({
  name = "scan",
  className,
}: {
  name?: BrailleSpinnerName;
  className?: string;
}) {
  const s = spinners[name];
  const [frame, setFrame] = useState(0);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % s.frames.length),
      s.interval
    );
    return () => clearInterval(timer);
  }, [name, reduced, s.frames.length, s.interval]);

  if (reduced) {
    return <span className={cn("font-mono", className)}>{"\u2588"}</span>;
  }

  return (
    <span className={cn("font-mono", className)}>{s.frames[frame]}</span>
  );
}
