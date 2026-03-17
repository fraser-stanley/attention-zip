"use client";

import { useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/ui/arrow-right";

export function AnimatedArrowLink({
  href,
  children,
  size,
}: {
  href: string;
  children: React.ReactNode;
  size?: "default" | "xs" | "sm" | "lg";
}) {
  const arrowRef = useRef<ArrowRightIconHandle>(null);

  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "outline", size })}
      onMouseEnter={() => arrowRef.current?.startAnimation()}
      onMouseLeave={() => arrowRef.current?.stopAnimation()}
    >
      {children}
      <ArrowRightIcon ref={arrowRef} size={14} />
    </Link>
  );
}
