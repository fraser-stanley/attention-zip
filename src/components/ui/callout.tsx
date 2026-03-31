import type { ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

type CalloutVariant = "info" | "warning" | "tip" | "check";

const variantStyles: Record<
  CalloutVariant,
  {
    accent: string;
    background: string;
    border: string;
  }
> = {
  info: {
    accent: "text-sky-600 dark:text-sky-300",
    background: "bg-sky-500/6",
    border: "border-sky-500/20",
  },
  warning: {
    accent: "text-amber-700 dark:text-amber-300",
    background: "bg-amber-500/7",
    border: "border-amber-500/25",
  },
  tip: {
    accent: "text-violet-700 dark:text-violet-300",
    background: "bg-violet-500/6",
    border: "border-violet-500/20",
  },
  check: {
    accent: "text-[#1f7a00] dark:text-[#7dff4d]",
    background: "bg-[#3FFF00]/10",
    border: "border-[#3FFF00]/25",
  },
};

function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m10.29 3.86-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.71-3.14l-8-14a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function TipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.75c.63.44 1 .98 1 1.75V18h6v-1.5c0-.77.37-1.31 1-1.75A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CalloutIcon({ variant }: { variant: CalloutVariant }) {
  if (variant === "warning") {
    return <WarningIcon className="size-4" />;
  }

  if (variant === "tip") {
    return <TipIcon className="size-4" />;
  }

  if (variant === "check") {
    return <CheckIcon className="size-4" />;
  }

  return <InfoIcon className="size-4" />;
}

export function Callout({
  variant = "info",
  title,
  className,
  children,
}: {
  variant?: CalloutVariant;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const styles = variantStyles[variant];

  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3",
        styles.border,
        styles.background,
        className
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-current/10 bg-background/70",
          styles.accent
        )}
      >
        <CalloutIcon variant={variant} />
      </div>
      <div className="min-w-0 space-y-1">
        {title ? <p className="text-sm font-medium">{title}</p> : null}
        <div className="space-y-1.5 text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-background/80 [&_code]:px-1 [&_code]:py-0.5 [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
