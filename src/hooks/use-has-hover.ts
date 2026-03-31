"use client";

import { useEffect, useState } from "react";

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

export function useHasHover() {
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(HOVER_QUERY);
    const updateMatch = () => setHasHover(mediaQuery.matches);

    updateMatch();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMatch);
      return () => mediaQuery.removeEventListener("change", updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, []);

  return hasHover;
}
