"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const IDLE_TIMEOUT = 10_000;

const INTERACTION_EVENTS = [
  "mousemove",
  "scroll",
  "keydown",
  "click",
  "touchstart",
] as const;

const TRIGGER_EVENT = "screensaver:trigger";

export function triggerScreensaver() {
  window.dispatchEvent(new CustomEvent(TRIGGER_EVENT));
}

export function Screensaver() {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(true), IDLE_TIMEOUT);
  }, []);

  const dismiss = useCallback(() => {
    setActive(false);
    resetTimer();
  }, [resetTimer]);

  // Portal mount guard
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- mount guard for portal
  }, []);

  // Manual trigger via custom event
  useEffect(() => {
    const onTrigger = () => setActive(true);
    window.addEventListener(TRIGGER_EVENT, onTrigger);
    return () => window.removeEventListener(TRIGGER_EVENT, onTrigger);
  }, []);

  // Idle detection
  useEffect(() => {
    resetTimer();

    const onActivity = () => {
      if (!active) resetTimer();
    };

    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [active, resetTimer]);

  // Dismiss on any interaction while active.
  // Wait for the entrance animation to finish before attaching dismiss
  // listeners so the triggering gesture doesn't immediately close it.
  useEffect(() => {
    if (!active) return;

    const onDismiss = () => dismiss();
    const timer = setTimeout(() => {
      for (const event of INTERACTION_EVENTS) {
        window.addEventListener(event, onDismiss, { once: true, passive: true });
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, onDismiss);
      }
    };
  }, [active, dismiss]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {active && (
          <motion.div
            key="screensaver-sign"
            className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none"
            style={{ willChange: "transform, opacity" }}
            variants={{
              hidden: reducedMotion
                ? { opacity: 0 }
                : {
                    scale: 3,
                    y: "-10vh",
                    rotate: -3,
                    // filter: "blur(12px)",
                    opacity: 0,
                  },
              visible: reducedMotion
                ? { opacity: 1 }
                : {
                    scale: [3, 1.8, 0.985, 1.005, 1],
                    y: ["-10vh", "-2vh", "0.3vh", "-0.1vh", "0vh"],
                    rotate: [-2, -0.8, 0.4, -0.1, 0.15],
                    // filter: [
                    //   "blur(12px)",
                    //   "blur(4px)",
                    //   "blur(0px)",
                    //   "blur(0px)",
                    //   "blur(0px)",
                    // ],
                    opacity: [0, 1, 1, 1, 1],
                    transition: {
                      duration: 0.65,
                      times: [0, 0.2, 0.6, 0.75, 1],
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
              exit: reducedMotion
                ? { opacity: 0 }
                : {
                    y: "-8vh",
                    opacity: 0,
                    transition: {
                      duration: 0.15,
                      ease: [0.165, 0.84, 0.44, 1],
                    },
                  },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <img
              src="/saver.png"
              alt="ATTENTION .zip screensaver"
              className="w-[70vw] max-w-[800px] drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
              draggable={false}
            />
          </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
