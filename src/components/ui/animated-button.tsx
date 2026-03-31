"use client";

import { useRef, Children, isValidElement, cloneElement } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants>;

export function AnimatedButton({
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}: AnimatedButtonProps) {
  const iconRefs = useRef<(IconHandle | null)[]>([]);

  const handleMouseEnter: AnimatedButtonProps["onMouseEnter"] = (e) => {
    iconRefs.current.forEach((ref) => ref?.startAnimation());
    onMouseEnter?.(e);
  };

  const handleMouseLeave: AnimatedButtonProps["onMouseLeave"] = (e) => {
    iconRefs.current.forEach((ref) => ref?.stopAnimation());
    onMouseLeave?.(e);
  };

  let iconIndex = 0;
  const clonedChildren = Children.map(children, (child) => {
    if (
      isValidElement(child) &&
      typeof child.type !== "string" &&
      "displayName" in child.type &&
      typeof child.type.displayName === "string" &&
      child.type.displayName.endsWith("Icon")
    ) {
      const currentIndex = iconIndex++;
      return cloneElement(child as React.ReactElement<{ ref?: React.Ref<IconHandle> }>, {
        ref: (el: IconHandle | null) => {
          iconRefs.current[currentIndex] = el;
        },
      });
    }
    return child;
  });

  return (
    <Button
      className={cn(className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {clonedChildren}
    </Button>
  );
}
