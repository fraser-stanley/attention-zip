"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface ToastPosition {
  x: number;
  y: number;
}

interface ToastContextValue {
  toast: (message: string, position?: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

interface ToastItem {
  id: number;
  message: string;
  position: ToastPosition | null;
}

const EDGE_PADDING = 12;
const TOAST_OFFSET_Y = 12;

function clampPosition(x: number, y: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Estimate toast size for clamping (will be roughly 200x36)
  const estimatedWidth = 200;
  const estimatedHeight = 36;

  const left = Math.min(
    Math.max(EDGE_PADDING, x - estimatedWidth / 2),
    vw - estimatedWidth - EDGE_PADDING,
  );
  const top = Math.min(
    Math.max(EDGE_PADDING, y - estimatedHeight - TOAST_OFFSET_Y),
    vh - estimatedHeight - EDGE_PADDING,
  );

  return { left, top };
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const lastPositionRef = useRef<ToastPosition | null>(null);
  const timerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Dismiss toast on scroll — user has moved on
  useEffect(() => {
    if (!current) return;

    const dismiss = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrent(null);
    };

    window.addEventListener("scroll", dismiss, { passive: true });
    return () => window.removeEventListener("scroll", dismiss);
  }, [current]);

  const toast = useCallback((message: string, position?: ToastPosition) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const pos = position ?? null;
    lastPositionRef.current = pos;
    const item = { id: ++nextId, message, position: pos };
    setCurrent(item);
    timerRef.current = window.setTimeout(() => {
      setCurrent(null);
      timerRef.current = null;
    }, 1200);
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ease-out-quart: snappy for enter/exit (Emil's animation guide)
  const easeOutQuart = [0.165, 0.84, 0.44, 1] as const;
  // Use lastPositionRef so the container stays put during exit animation
  const cursorPos = lastPositionRef.current;
  const hasPosition = cursorPos !== null;
  const positionStyle = hasPosition
    ? clampPosition(cursorPos.x, cursorPos.y)
    : undefined;

  return (
    <ToastContext value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={
              hasPosition
                ? "fixed z-[100] pointer-events-none"
                : "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            }
            style={positionStyle}
            role="status"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.2,
                    ease: easeOutQuart,
                  }}
                  className="pointer-events-auto flex items-center gap-2 bg-foreground px-3 py-1.5 border border-border font-sans"
                >
                  <span className="type-caption whitespace-nowrap text-background">
                    {current.message}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
