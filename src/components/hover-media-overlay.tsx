"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Image from "next/image";

function subscribeToMedia(cb: () => void) {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getHasPointer() {
  return window.matchMedia("(pointer: fine)").matches;
}

function useHasPointer() {
  return useSyncExternalStore(subscribeToMedia, getHasPointer, () => false);
}

interface HoverMediaOverlayProps {
  imageUrl: string | null;
}

export function HoverMediaOverlay({ imageUrl }: HoverMediaOverlayProps) {
  const hasPointer = useHasPointer();
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const handleLoad = useCallback(() => {
    setLoadedUrl(imageUrl);
  }, [imageUrl]);

  const visible = hasPointer && !!imageUrl && loadedUrl === imageUrl;

  if (!hasPointer || !imageUrl) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease-out",
      }}
    >
      <Image
        src={imageUrl}
        alt=""
        width={420}
        height={420}
        onLoad={handleLoad}
        className="max-h-[50vh] max-w-[420px] object-contain"
      />
    </div>
  );
}
