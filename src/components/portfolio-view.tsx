"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NumberFlow, { NumberFlowGroup, type Format } from "@number-flow/react";

import { QRCodeSVG } from "qrcode.react";
import { HoverMediaOverlay } from "@/components/hover-media-overlay";
import { useToast } from "@/components/toast";

import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { Skeleton } from "@/components/ui/skeleton";
import { isWalletAddress } from "@/lib/wallet-address";
import {
  usePortfolioData,
  type PortfolioPosition,
  type PortfolioSummary,
} from "@/hooks/use-portfolio-data";

import {
  truncateAddress,
} from "@/lib/zora";
import { cn } from "@/lib/utils";

const TIMING_TRANSFORM: EffectTiming = {
  duration: 650,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};
const TIMING_SPIN: EffectTiming = {
  duration: 650,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};
const TIMING_OPACITY: EffectTiming = {
  duration: 350,
  easing: "ease-out",
};

const FLOW_TIMING = {
  transformTiming: TIMING_TRANSFORM,
  spinTiming: TIMING_SPIN,
  opacityTiming: TIMING_OPACITY,
} as const;

const FMT_CURRENCY = {
  style: "currency",
  currency: "USD",
  signDisplay: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} satisfies Format;

const FMT_COMPACT = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
} satisfies Format;


const FMT_PERCENT = {
  style: "percent",
  signDisplay: "always",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} satisfies Format;

const FMT_PRICE = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
} satisfies Format;

function changeChipClass(value: number | null, isSelected: boolean) {
  if (value === null) {
    return "border border-dashed border-border text-muted-foreground";
  }

  if (isSelected) {
    if (value > 0) return "text-[#3FFF00]";
    if (value < 0) return "text-[#FF00F0]";
    return "text-background";
  }

  if (value > 0) return "bg-[#3FFF00] text-black";
  if (value < 0) return "bg-[#FF00F0] text-black";
  return "bg-muted text-foreground";
}

function ValueCell({
  value,
  format = FMT_COMPACT,
}: {
  value: number;
  format?: Format;
}) {
  return (
    <NumberFlowGroup>
      <NumberFlow {...FLOW_TIMING} className="tabular-nums" format={format} value={value} />
    </NumberFlowGroup>
  );
}

function AddressLookup() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (isWalletAddress(trimmed)) {
      setError(false);
      router.push(`/portfolio/${trimmed}`);
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-black px-4 py-3" role="search" aria-label="Look up wallet portfolio">
      <label htmlFor="address-lookup" className="sr-only">Wallet address</label>
      <input
        id="address-lookup"
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError(false); }}
        placeholder="Look up any address"
        spellCheck={false}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        className={cn(
          "flex-1 border bg-white/[0.06] px-3 py-2 font-mono text-sm text-white placeholder:text-white/50 transition-colors focus:outline-none focus:ring-1 focus:ring-white",
          error ? "border-[#FF00F0]" : "border-white/20 focus:border-white/50",
        )}
      />
      <button
        type="submit"
        className={cn(
          "shrink-0 border px-4 py-2 font-mono text-sm transition-colors",
          input.trim()
            ? "border-white bg-white text-black hover:bg-white/85"
            : "border-white/20 bg-white/[0.06] text-white/50 hover:border-white/40 hover:bg-white/10 hover:text-white",
        )}
      >
        View
      </button>
    </form>
  );
}

function PortfolioStats({
  address,
  summary,
}: {
  address: string;
  summary: PortfolioSummary;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    navigator.clipboard.writeText(address);
    toast("Address copied", { x: e.clientX, y: e.clientY });
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [address, toast]);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-px bg-white/10">
      {/* QR code — left column, spans all rows */}
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

      {/* Stats — right column, top row */}
      <div className="grid gap-px sm:grid-cols-3 bg-white/10">
        <div className="bg-black p-4">
          <p className="type-label text-white/50">Portfolio value</p>
          <p className="mt-2 font-display text-5xl font-bold tracking-tight text-white">
            <span className="tabular-nums">
              <ValueCell value={summary.totalValueUsd} />
            </span>
            <span className="ml-2 text-xs text-white/50">USD</span>
          </p>
          <p className="mt-1 text-xs font-mono text-white/50">
            {summary.positionCount} positions
          </p>
        </div>

        <div className="bg-black p-4">
          <p className="type-label text-white/50">24h change</p>
          {summary.totalChangeUsd24h === null || summary.totalChangePct24h === null ? (
            <p className="mt-2 font-display text-5xl font-bold tracking-tight text-white/40">—</p>
          ) : (
            <div className="mt-2">
              <p className="font-display text-5xl font-bold tracking-tight text-white">
                <span className={cn("inline px-[0.15em] py-[0.02em] box-decoration-clone", changeChipClass(summary.totalChangeUsd24h, false))}>
                  <ValueCell value={summary.totalChangeUsd24h} />
                </span>
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center px-1.5 py-0.5 font-mono text-xs",
                  changeChipClass(summary.totalChangeUsd24h, false),
                )}
              >
                <NumberFlow
                  {...FLOW_TIMING}
                  className="tabular-nums"
                  format={FMT_PERCENT}
                  value={summary.totalChangePct24h / 100}
                />
              </span>
            </div>
          )}
        </div>

        <div className="bg-black p-4">
          <p className="type-label text-white/50">Address</p>
          <button
            type="button"
            onClick={handleCopy}
            className="group/copy mt-2 flex items-center gap-2 text-left"
          >
            <span className="font-display text-4xl tracking-tight text-white">{truncateAddress(address)}</span>
            <span className="text-white/50 transition-colors group-hover/copy:text-white">
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </span>
          </button>
        </div>
      </div>

      {/* Address lookup — right column, bottom row */}
      <AddressLookup />
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-[auto_1fr] gap-px bg-white/10">
        <div className="row-span-2 flex aspect-square items-center justify-center bg-black p-5">
          <Skeleton className="h-full w-full bg-white/10" />
        </div>
        <div className="grid gap-px sm:grid-cols-3 bg-white/10">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="bg-black p-4">
              <Skeleton className="mb-3 h-4 w-24 bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
          ))}
        </div>
        <div className="bg-black px-4 py-3">
          <Skeleton className="h-10 w-48 bg-white/10" />
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-card">
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border bg-card px-4 py-12 text-center">
      <p className="font-display text-4xl tracking-tight">No coin balances found</p>
      <p className="type-body-sm mt-3 text-muted-foreground">
        This address does not currently hold any Zora coins on Base.
      </p>
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed border-border bg-card px-4 py-12 text-center">
      <p className="font-display text-4xl tracking-tight">{title}</p>
      <p className="type-body-sm mt-3 text-muted-foreground">{description}</p>
    </div>
  );
}

function PositionsContent({
  positions,
}: {
  positions: PortfolioPosition[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  if (positions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden border border-border bg-card text-sm" onMouseLeave={() => setHoveredImage(null)}>
        <HoverMediaOverlay imageUrl={hoveredImage} />
        <div className="overflow-x-auto">
          <div className="grid min-w-[56rem] w-full grid-cols-[3rem_minmax(14rem,1.8fr)_1fr_1fr_1fr_1fr] gap-4 border-b border-border/70 px-4 py-3 type-label font-mono text-muted-foreground">
            <span>Rank</span>
            <span>Coin</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Price</span>
            <span className="text-right">Value</span>
            <span className="text-right">24h</span>
          </div>

          {positions.map((position, i) => {
            const isSelected = position.address === selectedId;

            return (
              <div
                key={position.address}
                onMouseEnter={() => {
                  setSelectedId(position.address);
                  setHoveredImage(position.imageUrl);
                }}
                onMouseLeave={() => setSelectedId(null)}
                className={cn(
                  "grid min-w-[56rem] w-full grid-cols-[3rem_minmax(14rem,1.8fr)_1fr_1fr_1fr_1fr] min-h-[44px] cursor-default items-center gap-4 border-b border-border/70 px-4 py-2 last:border-b-0 transition-colors duration-200",
                  isSelected ? "bg-foreground text-background" : "hover:bg-muted/35",
                )}
              >
                {/* Rank */}
                <div
                  className={cn(
                    "font-mono tabular-nums",
                    isSelected ? "text-background/60" : "text-muted-foreground",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Coin */}
                <div className="flex items-center gap-2 min-w-0 font-mono">
                  <span
                    className={cn(
                      "truncate min-w-0",
                      isSelected ? "text-background" : "text-foreground",
                    )}
                  >
                    {position.name}
                  </span>
                  {position.symbol ? (
                    <span
                      className={cn(
                        "truncate max-w-[120px]",
                        isSelected ? "text-background/50" : "text-muted-foreground",
                      )}
                    >
                      ${position.symbol}
                    </span>
                  ) : null}
                </div>

                {/* Balance */}
                <div
                  className={cn(
                    "text-right font-mono tabular-nums",
                    isSelected ? "text-background/60" : "text-muted-foreground",
                  )}
                >
                  <NumberFlow
                    {...FLOW_TIMING}
                    format={{ maximumFractionDigits: 2 }}
                    value={position.balance}
                  />
                </div>

                {/* Price */}
                <div
                  className={cn(
                    "text-right font-mono tabular-nums",
                    isSelected ? "text-background/60" : "text-muted-foreground",
                  )}
                >
                  {position.priceUsd === null ? (
                    "—"
                  ) : (
                    <NumberFlow
                      {...FLOW_TIMING}
                      className="tabular-nums"
                      format={FMT_PRICE}
                      value={position.priceUsd}
                    />
                  )}
                </div>

                {/* Value */}
                <div className="text-right">
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 font-mono tabular-nums",
                      isSelected ? "text-background" : "bg-muted",
                    )}
                  >
                    <ValueCell value={position.balanceUsd} />
                  </span>
                </div>

                {/* 24h */}
                <div className="text-right">
                  {position.changeUsd24h === null || position.changePct24h === null ? (
                    <span
                      className={cn(
                        "font-mono",
                        isSelected ? "text-background/50" : "text-muted-foreground",
                      )}
                    >
                      —
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 font-mono tabular-nums",
                        changeChipClass(position.changeUsd24h, isSelected),
                      )}
                    >
                      <NumberFlow
                        {...FLOW_TIMING}
                        format={FMT_CURRENCY}
                        value={position.changeUsd24h}
                      />
                      <NumberFlow
                        {...FLOW_TIMING}
                        format={FMT_PERCENT}
                        value={position.changePct24h / 100}
                      />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export function PortfolioView({ address }: { address: string }) {
  const { positions, summary, isLoading, error } = usePortfolioData(address);

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PlaceholderCard
          title="Portfolio unavailable"
          description="The portfolio lookup failed. Try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <PortfolioStats address={address} summary={summary} />

      <PositionsContent positions={positions} />
    </div>
  );
}
