"use client";

import { useCallback, useRef, useState } from "react";
import NumberFlow, { NumberFlowGroup, type Format } from "@number-flow/react";
import Link from "next/link";
import { HoverMediaOverlay } from "@/components/hover-media-overlay";
import { useToast } from "@/components/toast";
import { SkillCard } from "@/components/skill-card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePortfolioData,
  type PortfolioPosition,
  type PortfolioSummary,
} from "@/hooks/use-portfolio-data";
import { skills } from "@/lib/skills";
import {
  coinTypeLabel,
  formatCompactCurrency,
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

const FMT_INT = { maximumFractionDigits: 0 } satisfies Format;

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

function changeChipClass(value: number | null) {
  if (value === null) {
    return "border border-dashed border-border text-muted-foreground";
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address);
    toast("Address copied");
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [address, toast]);

  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card p-4">
        <p className="type-label mb-2 text-muted-foreground">Portfolio value</p>
        <p className="font-display text-5xl tracking-tight">
          <span className="highlight-block tabular-nums">
            <ValueCell value={summary.totalValueUsd} />
          </span>
        </p>
      </div>

      <div className="bg-card p-4">
        <p className="type-label mb-2 text-muted-foreground">24h change</p>
        {summary.totalChangeUsd24h === null || summary.totalChangePct24h === null ? (
          <p className="font-display text-5xl tracking-tight text-muted-foreground">Unavailable</p>
        ) : (
          <p className="font-display text-5xl tracking-tight">
            <span className={cn("inline px-[0.15em] py-[0.02em] box-decoration-clone", changeChipClass(summary.totalChangeUsd24h))}>
              <ValueCell value={summary.totalChangeUsd24h} />
            </span>
            <span
              className={cn(
                "type-body-sm ml-2 inline-flex items-center px-1.5 py-0.5 font-mono align-middle",
                changeChipClass(summary.totalChangeUsd24h),
              )}
            >
              <NumberFlow
                {...FLOW_TIMING}
                className="tabular-nums"
                format={FMT_PERCENT}
                value={summary.totalChangePct24h / 100}
              />
            </span>
          </p>
        )}
      </div>

      <div className="bg-card p-4">
        <p className="type-label mb-2 text-muted-foreground">Positions</p>
        <p className="font-display text-5xl tracking-tight">
          <NumberFlow {...FLOW_TIMING} className="tabular-nums" format={FMT_INT} value={summary.positionCount} />
        </p>
      </div>

      <div className="bg-card p-4">
        <p className="type-label mb-2 text-muted-foreground">Address</p>
        <button
          type="button"
          onClick={handleCopy}
          className="group/copy flex items-center gap-2 text-left"
        >
          <span className="font-display text-4xl tracking-tight">{truncateAddress(address)}</span>
          <span className="text-muted-foreground transition-colors group-hover/copy:text-foreground">
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </span>
        </button>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-card p-4">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
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
  summary,
}: {
  positions: PortfolioPosition[];
  summary: PortfolioSummary;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  if (positions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <p className="py-6 font-display text-5xl tracking-tight">
        {summary.positionCount} positions,{" "}
        <span className="tabular-nums">{formatCompactCurrency(summary.totalValueUsd)}</span> total value
      </p>

      <div className="relative overflow-hidden border border-border bg-card" onMouseLeave={() => setHoveredImage(null)}>
        <HoverMediaOverlay imageUrl={hoveredImage} />
        <div className="overflow-x-auto">
          <div className="grid min-w-[56rem] w-full grid-cols-[3rem_minmax(14rem,1.8fr)_1fr_1fr_1fr_1fr] gap-4 border-b border-border/70 px-4 py-3 type-label text-muted-foreground">
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
                    "type-body-sm flex items-center gap-2 font-mono",
                    isSelected ? "text-background/72" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      isSelected ? "bg-background" : "bg-foreground/25",
                    )}
                  />
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>

                {/* Coin */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "type-body-sm font-medium truncate min-w-0",
                        isSelected ? "text-background" : "text-foreground",
                      )}
                    >
                      {position.name}
                    </span>
                    {position.symbol ? (
                      <span
                        className={cn(
                          "type-caption font-mono truncate max-w-[120px]",
                          isSelected ? "text-background/60" : "text-muted-foreground",
                        )}
                      >
                        ${position.symbol}
                      </span>
                    ) : null}
                    {position.coinType ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.16em]",
                          isSelected ? "border-background/30 text-background/70" : "",
                        )}
                      >
                        {coinTypeLabel(position.coinType)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {/* Balance */}
                <div
                  className={cn(
                    "text-right font-mono",
                    isSelected ? "text-background/80" : "text-muted-foreground",
                  )}
                >
                  <NumberFlow
                    {...FLOW_TIMING}
                    className="tabular-nums"
                    format={{ maximumFractionDigits: 2 }}
                    value={position.balance}
                  />
                </div>

                {/* Price */}
                <div
                  className={cn(
                    "text-right font-mono",
                    isSelected ? "text-background/80" : "text-muted-foreground",
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
                      "type-body-sm inline-flex items-center px-1.5 py-0.5 font-mono font-medium tabular-nums",
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
                        "type-caption font-mono",
                        isSelected ? "text-background/60" : "text-muted-foreground",
                      )}
                    >
                      Unavailable
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "type-caption inline-flex items-center gap-1 px-1.5 py-0.5 font-mono tabular-nums",
                        changeChipClass(position.changeUsd24h),
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

function InstalledSkills() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-label text-foreground">Skills</h2>
        <Link
          href="/skills"
          className="type-label text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
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
        <InstalledSkills />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PortfolioStats address={address} summary={summary} />

      <PositionsContent positions={positions} summary={summary} />

      <InstalledSkills />
    </div>
  );
}
