"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/components/toast";
import { TextMorph } from "@/components/text-morph";

const MOCK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const WALLETS = [
  { name: "MetaMask", color: "#F6851B" },
  { name: "Coinbase Wallet", color: "#0052FF" },
  { name: "WalletConnect", color: "#3B99FC" },
];

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store element to restore focus on close
    returnFocusRef.current = document.activeElement as HTMLElement;

    // Focus the container after animation settles
    const timer = setTimeout(() => {
      containerRef.current?.focus();
    }, 50);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, containerRef]);

  // Restore focus when deactivated
  useEffect(() => {
    if (active) return;
    returnFocusRef.current?.focus();
  }, [active]);
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect } = useWallet();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const prevOpen = useRef(open);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount detection for portal
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset connecting state when modal closes
  useEffect(() => {
    if (prevOpen.current && !open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on close transition
      setConnecting(null);
    }
    prevOpen.current = open;
  }, [open]);

  const handleConnect = useCallback((walletName: string) => {
    setConnecting(walletName);
    setTimeout(() => {
      connect(MOCK_ADDRESS);
      toast("Connected as vitalik.eth");
      onClose();
    }, 250);
  }, [connect, toast, onClose]);

  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <div className="relative flex items-center justify-center h-full pointer-events-none">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-modal-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration }}
              className="pointer-events-auto w-full max-w-sm bg-black border border-white/10 overflow-hidden outline-none"
            >
              <div className="px-5 pt-5 pb-3">
                <h2 id="wallet-modal-title" className="type-caption uppercase text-white/50">
                  Connect Wallet
                </h2>
              </div>

              <div className="flex flex-col">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    disabled={connecting !== null}
                    className="type-body-sm flex items-center gap-3 border-t border-white/5 px-5 py-3.5 text-left text-white transition-colors hover:bg-white/5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
                  >
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <span className="flex-1"><TextMorph>{wallet.name}</TextMorph></span>
                    <span className="type-caption text-white/40">
                      <TextMorph>
                        {connecting === wallet.name ? "Connecting..." : ""}
                      </TextMorph>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
