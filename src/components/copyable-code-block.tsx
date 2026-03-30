"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { HighlightedCodeText } from "@/components/highlighted-code-text";
import { cn } from "@/lib/utils";

export function CopyableCodeBlock({
  command,
  prefix = "$",
  className,
}: {
  command: string;
  prefix?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
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
      <span className="text-foreground/40">{prefix}</span>
      <HighlightedCodeText
        text={command}
        variant={prefix === ">" ? "prompt" : "shell"}
        className="min-w-0 flex-1 truncate text-left text-foreground/80 whitespace-nowrap"
      />
      <span className="shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground/60">
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </span>
    </button>
  );
}
