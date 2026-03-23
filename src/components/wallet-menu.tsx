"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import { useToast } from "@/components/toast";
import { CopyIcon } from "@/components/ui/copy";
import { CheckIcon } from "@/components/ui/check";

const MOCK_BALANCE = {
  eth: "0.142",
  usdc: "353.03",
  totalUsd: "$389.47",
};

interface WalletMenuProps {
  open: boolean;
  onClose: () => void;
}

export function WalletMenu({ open, onClose }: WalletMenuProps) {
  const { address, disconnect } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast("Address copied");
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
  }, [address, toast]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    onClose();
    toast("Disconnected");
  }, [disconnect, onClose, toast]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!address) return null;

  return (
    <div
      inert={!open ? true : undefined}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[100]",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/[0.58] transition-[opacity,backdrop-filter] duration-200 ease-out",
          open ? "opacity-100 backdrop-blur-[6px]" : "opacity-0 backdrop-blur-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative h-full"
        onClick={(e) => {
          const target = e.target;
          if (!(target instanceof HTMLElement)) return;
          if (target.closest("a, button, [role='button']")) return;
          onClose();
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end pt-14">
            <div
              className={cn(
                "grid grid-cols-[auto_340px] gap-px text-white transition-[transform,opacity] duration-100 ease-out",
                open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              )}
            >
              {/* Left column: QR code spanning rows 1+2, perfectly square */}
              <div className="row-span-2 aspect-square bg-black p-5 flex items-center justify-center">
                <QRCodeSVG
                  value={address}
                  size={0}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                  className="h-full w-full"
                />
              </div>

              {/* Right column row 1: Balance info */}
              <div className="bg-black p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <p className="type-caption font-mono text-white/50">YOUR WALLET</p>
                  <button
                    onClick={onClose}
                    className="text-white/50 hover:text-white transition-colors p-1 -m-1"
                    aria-label="Close wallet menu"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                <div>
                  <p className="text-5xl font-display font-bold tracking-tight mb-1">{MOCK_BALANCE.totalUsd} <span className="text-sm text-white/50">USD</span></p>
                  <div className="flex items-center gap-4 text-sm font-mono text-white/50">
                    <span>{MOCK_BALANCE.eth} ETH</span>
                    <span>{MOCK_BALANCE.usdc} USDC</span>
                  </div>
                </div>
              </div>

              {/* Right column row 2: Address + Add Funds */}
              <div className="flex items-center gap-3 bg-black px-4 py-3">
                <button
                  onClick={handleCopy}
                  className="group/copy flex flex-1 items-center justify-between border border-white/10 px-3 py-2 text-sm font-mono hover:border-white/30 transition-colors"
                >
                  <span>{truncateAddress(address)}</span>
                  <span className="text-white/50 group-hover/copy:text-white">
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  </span>
                </button>
                <a
                  href="#"
                  className="flex shrink-0 items-center justify-center bg-white px-5 py-2 text-sm font-medium text-black ring-1 ring-inset ring-black transition-colors"
                >
                  Add funds
                </a>
              </div>

              {/* Right column row 3: Disconnect (right column only) */}
              <button
                onClick={handleDisconnect}
                className="col-start-2 flex w-full items-center justify-center bg-black p-4 text-sm font-medium text-white/50 ring-inset ring-0 hover:bg-white hover:text-black hover:ring-1 hover:ring-black transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
