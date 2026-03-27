"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { useToast } from "@/components/toast";
import { usePortfolioData } from "@/hooks/use-portfolio-data";
import { truncateAddress, useWallet } from "@/lib/wallet-context";
import { cn } from "@/lib/utils";
import { formatCompactCurrency } from "@/lib/zora";

interface WalletMenuProps {
  open: boolean;
  onClose: () => void;
}

export function WalletMenu({ open, onClose }: WalletMenuProps) {
  const { address, disconnect } = useWallet();
  const { toast } = useToast();
  const { summary, isLoading, error } = usePortfolioData(address);
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

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!address) return null;

  return (
    <div
      inert={!open ? true : undefined}
      aria-hidden={!open}
      className={cn("fixed inset-0 z-[100]", open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/[0.58] transition-[opacity,backdrop-filter] duration-200 ease-out",
          open ? "opacity-100 backdrop-blur-[6px]" : "opacity-0 backdrop-blur-0"
        )}
        onClick={onClose}
      />

      <div
        className="relative h-full"
        onClick={(event) => {
          const target = event.target;
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
              <div className="row-span-2 flex aspect-square items-center justify-center bg-black p-5">
                <QRCodeSVG
                  value={address}
                  size={0}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                  className="h-full w-full"
                />
              </div>

              <div className="flex flex-col gap-3 bg-black p-4">
                <div className="flex items-start justify-between">
                  <p className="type-caption font-mono text-white/50">YOUR WALLET</p>
                  <button
                    onClick={onClose}
                    className="p-1 -m-1 text-white/50 transition-colors hover:text-white"
                    aria-label="Close wallet menu"
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
                  </button>
                </div>

                <div>
                  <p className="mb-1 font-display text-5xl font-bold tracking-tight">
                    {isLoading ? "Loading" : formatCompactCurrency(summary.totalValueUsd)}
                    <span className="ml-2 text-sm text-white/50">USD</span>
                  </p>
                  {error ? (
                    <p className="text-sm font-mono text-white/45">Portfolio unavailable</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-white/50">
                      <span>{summary.positionCount} positions</span>
                      {summary.totalChangeUsd24h !== null ? (
                        <span>
                          24h {summary.totalChangeUsd24h >= 0 ? "+" : ""}
                          {formatCompactCurrency(summary.totalChangeUsd24h)}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-black px-4 py-3">
                <button
                  onClick={handleCopy}
                  className="group/copy flex flex-1 items-center justify-between border border-white/10 px-3 py-2 text-sm font-mono transition-colors hover:border-white/30"
                >
                  <span>{truncateAddress(address)}</span>
                  <span className="text-white/50 group-hover/copy:text-white">
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  </span>
                </button>

                <Link
                  href="/portfolio"
                  onClick={onClose}
                  className="flex min-h-[44px] shrink-0 items-center justify-center bg-white px-5 py-2 text-sm font-medium text-black ring-1 ring-inset ring-black transition-colors"
                >
                  Portfolio
                </Link>
              </div>

              <button
                onClick={handleDisconnect}
                className="col-start-2 flex w-full items-center justify-center bg-black p-4 text-sm font-medium text-white/50 transition-colors hover:bg-white hover:text-black hover:ring-1 hover:ring-black"
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
