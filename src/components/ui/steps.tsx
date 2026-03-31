import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

function Steps({ className, ...props }: ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      className={cn("space-y-6 [counter-reset:step]", className)}
      {...props}
    />
  );
}

function Step({
  className,
  title,
  children,
  ...props
}: ComponentPropsWithoutRef<"li"> & {
  title: ReactNode;
}) {
  return (
    <li
      className={cn(
        "relative pl-14 after:absolute after:bottom-[-1.5rem] after:left-4 after:top-10 after:w-px after:bg-border last:after:hidden last:[&_>div]:border-b-0 last:[&_>div]:pb-0",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-mono before:[counter-increment:step] before:content-[counter(step)]"
      />
      <div className="space-y-1.5 border-b border-border/60 pb-6">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="space-y-1.5 text-sm text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </li>
  );
}

export { Steps, Step };
