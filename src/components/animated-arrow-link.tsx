"use client";

import { useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/ui/arrow-right";
import { cn } from "@/lib/utils";

export function AnimatedArrowLink({
  href,
  children,
  variant = "outline",
  size,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg";
  className?: string;
}) {
  const arrowRef = useRef<ArrowRightIconHandle>(null);

  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onMouseEnter={() => arrowRef.current?.startAnimation()}
      onMouseLeave={() => arrowRef.current?.stopAnimation()}
    >
      {children}
      <ArrowRightIcon ref={arrowRef} size={14} />
    </Link>
  );
}
