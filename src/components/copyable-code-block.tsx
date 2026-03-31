"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { HighlightedCodeText } from "@/components/highlighted-code-text";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export function CopyableCodeBlock({
  command,
  highlight = true,
  className,
}: {
  command: string;
  highlight?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy(e: React.MouseEvent) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast("Copied to clipboard", { x: e.clientX, y: e.clientY });
    } catch {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "group flex w-full items-center gap-3 border border-border bg-foreground/5 px-4 py-3 font-mono text-[0.8125rem] transition-colors hover:border-foreground/20 hover:bg-foreground/[0.07]",
        className,
      )}
      title={copied ? "Copied" : "Copy command"}
      aria-live="polite"
    >
      <span className="min-w-0 flex-1 truncate text-left text-foreground/40 whitespace-nowrap">
        <HighlightedCodeText
          text={command}
          variant={highlight ? "shell" : "plain"}
          className="text-foreground/80"
        />
      </span>
      <span className="relative shrink-0 size-4 text-muted-foreground/60">
        <span className={cn(
          "absolute inset-0 transition-[opacity,transform] duration-200 ease-out",
          copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
        )}>
          <CopyIcon size={16} />
        </span>
        <span className={cn(
          "absolute inset-0 transition-[opacity,transform] duration-200 ease-out",
          copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}>
          <CheckIcon size={16} />
        </span>
      </span>
    </button>
  );
}
