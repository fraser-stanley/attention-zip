"use client";

import { layoutWithLines, prepareWithSegments, type PreparedTextWithSegments } from "@chenglou/pretext";
import { useEffect, useRef, useState } from "react";

const SINGLE_LINE_HEIGHT = 1;
const UNBOUNDED_LINE_WIDTH = Number.MAX_SAFE_INTEGER;
const ITEM_PADDING_X_PX = 32;
const ITEM_SEGMENT_GAPS_PX = 18;
const ACTION_CHIP_PADDING_X_PX = 12;
const ENTRY_SEPARATOR_WIDTH_PX = 12;

function measurePreparedWidth(prepared: PreparedTextWithSegments): number {
  const result = layoutWithLines(prepared, UNBOUNDED_LINE_WIDTH, SINGLE_LINE_HEIGHT);
  return result.lines[0]?.width ?? 0;
}

export function useTickerWidth(items: string[], font: string): number {
  const cacheRef = useRef(new Map<string, PreparedTextWithSegments>());
  const [width, setWidth] = useState(0);
  const canMeasure = font.trim().length > 0 && items.length > 0;

  useEffect(() => {
    if (typeof window === "undefined" || !canMeasure) {
      return;
    }

    let frameId = 0;

    const measure = () => {
      const totalTextWidth = items.reduce((sum, item) => {
        const cacheKey = `${font}::${item}`;
        let prepared = cacheRef.current.get(cacheKey);
        if (!prepared) {
          prepared = prepareWithSegments(item, font);
          cacheRef.current.set(cacheKey, prepared);
        }

        return sum + measurePreparedWidth(prepared);
      }, 0);

      const totalChromeWidth = items.length * (
        ITEM_PADDING_X_PX +
        ITEM_SEGMENT_GAPS_PX +
        ACTION_CHIP_PADDING_X_PX
      ) + Math.max(items.length - 1, 0) * ENTRY_SEPARATOR_WIDTH_PX;
      setWidth(totalTextWidth + totalChromeWidth);
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener("resize", scheduleMeasure);

    const fontFaceSet = document.fonts;
    fontFaceSet?.addEventListener?.("loadingdone", scheduleMeasure);
    void fontFaceSet?.ready.then(scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleMeasure);
      fontFaceSet?.removeEventListener?.("loadingdone", scheduleMeasure);
    };
  }, [canMeasure, font, items]);

  return canMeasure ? width : 0;
}
