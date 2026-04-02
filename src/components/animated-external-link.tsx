"use client";

import { useRef } from "react";
import { ArrowUpRightIcon, type ArrowUpRightIconHandle } from "@/components/ui/arrow-up-right";
import { cn } from "@/lib/utils";

interface AnimatedExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  iconSize?: number;
  srLabel?: string;
}

export function AnimatedExternalLink({
  href,
  children,
  className,
  iconSize = 12,
  srLabel,
}: AnimatedExternalLinkProps) {
  const arrowRef = useRef<ArrowUpRightIconHandle>(null);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1", className)}
      onMouseEnter={() => arrowRef.current?.startAnimation()}
      onMouseLeave={() => arrowRef.current?.stopAnimation()}
    >
      {children}
      <ArrowUpRightIcon ref={arrowRef} aria-hidden="true" size={iconSize} />
      {srLabel && <span className="sr-only">{srLabel}</span>}
    </a>
  );
}
