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

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

interface ToastItem {
  id: number;
  message: string;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const timerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const toast = useCallback((message: string) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const item = { id: ++nextId, message };
    setCurrent(item);
    timerRef.current = window.setTimeout(() => {
      setCurrent(null);
      timerRef.current = null;
    }, 3000);
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ToastContext value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="pointer-events-auto flex items-center gap-2 rounded-full bg-black px-4 py-2.5 shadow-lg border border-white/10"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3FFF00"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="type-body-sm whitespace-nowrap text-white">
                    {current.message}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
