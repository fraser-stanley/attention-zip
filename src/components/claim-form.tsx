"use client";

import { startTransition, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { truncateAddress, useWallet } from "@/lib/wallet-context";
import { normalizeWalletAddress } from "@/lib/wallet-address";

interface ClaimFormProps {
  autoFocus?: boolean;
  claimCode: string;
  className?: string;
}

function getErrorMessage(status: number, payload: unknown) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error?: unknown }).error;

    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }

  switch (status) {
    case 400:
      return "Enter a valid wallet address.";
    case 404:
      return "This claim link is invalid or expired.";
    case 409:
      return "This agent is no longer claimable.";
    case 503:
      return "Claiming is not configured.";
    default:
      return "Failed to claim agent.";
  }
}

export function ClaimForm({
  autoFocus = false,
  claimCode,
  className,
}: ClaimFormProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { setAddress } = useWallet();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!autoFocus || typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const wallet = normalizeWalletAddress(value);

    if (!wallet) {
      setError("Enter a valid 0x wallet address.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agents/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim_code: claimCode,
          wallet,
        }),
      });

      let payload: unknown = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setError(getErrorMessage(response.status, payload));
        return;
      }

      const claimedWallet =
        typeof payload === "object" &&
        payload !== null &&
        "wallet" in payload &&
        typeof (payload as { wallet?: unknown }).wallet === "string"
          ? normalizeWalletAddress((payload as { wallet: string }).wallet)
          : wallet;

      if (!claimedWallet) {
        setError("Failed to claim agent.");
        return;
      }

      setAddress(claimedWallet);
      setValue("");
      toast(`Claimed ${truncateAddress(claimedWallet)}`);

      startTransition(() => {
        router.push(`/portfolio/${claimedWallet}`);
      });
    } catch {
      setError("Failed to claim agent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={cn("space-y-4", className)} onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="type-label block text-muted-foreground"
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
              if (error) {
                setError(null);
              }
            }}
            placeholder="0x..."
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            disabled={isSubmitting}
            className="h-11 border-border bg-background text-base touch-manipulation"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-w-[176px] font-mono touch-manipulation",
            )}
          >
            {isSubmitting ? "Claiming..." : "Claim agent"}
          </button>
        </div>

        <p className="type-caption font-mono text-muted-foreground">
          Run `zora wallet` to see your address
        </p>

        {error ? (
          <p
            role="alert"
            className="type-caption font-mono text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
