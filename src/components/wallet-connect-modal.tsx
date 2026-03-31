"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AddressConnectForm } from "@/components/address-connect-form";
import { Button } from "@/components/ui/button";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    returnFocusRef.current = document.activeElement as HTMLElement;

    const timer = window.setTimeout(() => {
      containerRef.current?.focus();
    }, 50);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (active) return;
    returnFocusRef.current?.focus();
  }, [active]);
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="pointer-events-none relative flex h-full items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-connect-title"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              transition={{ duration }}
              className="pointer-events-auto w-full max-w-2xl border border-white/10 bg-[#090909] text-white shadow-2xl outline-none"
            >
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 id="wallet-connect-title" className="font-display text-3xl tracking-tight sm:text-4xl">
                      View your positions
                    </h2>
                    <p className="type-body-sm max-w-xl text-white/60">
                      Paste your address from your Zora wallet to view your positions.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close wallet connect modal"
                    className="border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="px-5 py-5">
                <AddressConnectForm
                  autoFocus
                  onSuccess={onClose}
                  submitLabel="View portfolio"
                  variant="dark"
                />
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    portalTarget,
  );
}
