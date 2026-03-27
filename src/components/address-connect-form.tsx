"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast";
import { truncateAddress, useWallet } from "@/lib/wallet-context";
import { normalizeWalletAddress } from "@/lib/wallet-address";
import { cn } from "@/lib/utils";

interface AddressConnectFormProps {
  autoFocus?: boolean;
  className?: string;
  description?: string;
  onSuccess?: () => void;
  submitLabel?: string;
  title?: string;
  variant?: "light" | "dark";
}

export function AddressConnectForm({
  autoFocus = false,
  className,
  description,
  onSuccess,
  submitLabel = "Connect wallet",
  title,
  variant = "light",
}: AddressConnectFormProps) {
  const { setAddress } = useWallet();
  const { toast } = useToast();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoFocus || typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const isDark = variant === "dark";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextAddress = normalizeWalletAddress(value);
    if (!nextAddress) {
      setError("Enter a valid 0x wallet address.");
      return;
    }

    setAddress(nextAddress);
    setValue("");
    setError(null);
    toast(`Connected ${truncateAddress(nextAddress)}`);
    onSuccess?.();
  }

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      {(title || description) && (
        <div className="space-y-2">
          {title ? (
            <h2
              className={cn(
                "font-display tracking-tight",
                isDark ? "text-3xl text-white sm:text-4xl" : "text-4xl text-foreground sm:text-5xl",
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={cn(
                "type-body-sm max-w-xl",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className={cn(
            "type-label block",
            isDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Wallet address
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            ref={inputRef}
            id={inputId}
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder="0x..."
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            className={cn(
              "h-11 text-base touch-manipulation",
              isDark
                ? "border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/10"
                : "border-border bg-background",
            )}
          />

          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: isDark ? "default" : "outline" }),
              "min-w-[176px] font-mono touch-manipulation",
              isDark ? "bg-white text-black hover:bg-white/85" : "",
            )}
          >
            {submitLabel}
          </button>
        </div>

        <p className={cn("type-caption font-mono", isDark ? "text-white/45" : "text-muted-foreground")}>
          Run `zora wallet` to see your address
        </p>

        {error ? (
          <p
            role="alert"
            className={cn("type-caption font-mono", isDark ? "text-[#FF8BEF]" : "text-destructive")}
          >
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
