"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/components/toast";

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

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect } = useWallet();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const prevOpen = useRef(open);

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

  function handleConnect(walletName: string) {
    setConnecting(walletName);
    setTimeout(() => {
      connect(MOCK_ADDRESS);
      toast("Connected as vitalik.eth");
      onClose();
    }, 250);
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
              role="dialog"
              aria-modal="true"
              aria-label="Connect Wallet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration }}
              className="pointer-events-auto w-full max-w-sm bg-black border border-white/10 overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3">
                <p className="type-caption uppercase text-white/50">
                  Connect Wallet
                </p>
              </div>

              <div className="flex flex-col">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.name)}
                    disabled={connecting !== null}
                    className="type-body-sm flex items-center gap-3 border-t border-white/5 px-5 py-3.5 text-left text-white transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <span className="flex-1">{wallet.name}</span>
                    {connecting === wallet.name && (
                      <span className="type-caption text-white/40">Connecting...</span>
                    )}
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
