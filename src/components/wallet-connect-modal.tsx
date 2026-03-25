"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { useToast } from "@/components/toast";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { useWallet, truncateAddress } from "@/lib/wallet-context";
import type { WalletSession } from "@/lib/wallet-session";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

type ChallengeResponse = {
  nonce: string;
  expiresAt: string;
  command: string;
};

type ApiErrorResponse = {
  code?: string;
  error?: string;
};

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    returnFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      containerRef.current?.focus();
    }, 50);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (active) return;
    returnFocusRef.current?.focus();
  }, [active]);
}

function formatExpiry(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "Expires in 5 minutes";

  return `Expires at ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

async function parseApiError(response: Response) {
  let body: ApiErrorResponse | null = null;

  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    return "Request failed.";
  }

  return body?.error ?? "Request failed.";
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect } = useWallet();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [token, setToken] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const prevOpen = useRef(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    setChallenge(null);
    setChallengeError(null);
    setLoadingChallenge(false);
    setToken("");
    setVerifyError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (prevOpen.current && !open) {
      resetState();
    }
    prevOpen.current = open;
  }, [open, resetState]);

  const loadChallenge = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadingChallenge(true);
    setChallengeError(null);
    setVerifyError(null);

    try {
      const response = await fetch("/api/wallet/challenge", {
        method: "POST",
        cache: "no-store",
      });

      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        setChallenge(null);
        setChallengeError(await parseApiError(response));
        return;
      }

      const nextChallenge = (await response.json()) as ChallengeResponse;
      setChallenge(nextChallenge);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setChallenge(null);
      setChallengeError("Could not generate a connect command.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingChallenge(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadChallenge();
  }, [open, loadChallenge]);

  const handleVerify = useCallback(async () => {
    const nextToken = token.trim();
    if (!nextToken) {
      setVerifyError("Paste the token from `zora auth connect`.");
      return;
    }

    setSubmitting(true);
    setVerifyError(null);

    try {
      const response = await fetch("/api/wallet/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ token: nextToken }),
      });

      if (!response.ok) {
        const message = await parseApiError(response);
        setVerifyError(message);

        if (response.status === 410) {
          void loadChallenge();
        }
        return;
      }

      const data = (await response.json()) as {
        session?: WalletSession;
      };

      if (!data.session) {
        setVerifyError("Wallet verification failed.");
        return;
      }

      connect(data.session);
      toast(`Connected ${truncateAddress(data.session.address)}`);
      onClose();
    } catch {
      setVerifyError("Wallet verification failed.");
    } finally {
      setSubmitting(false);
    }
  }, [connect, loadChallenge, onClose, toast, token]);

  const expiryLabel = useMemo(
    () => (challenge ? formatExpiry(challenge.expiresAt) : "Expires in 5 minutes"),
    [challenge],
  );

  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="relative flex h-full items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-modal-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration }}
              className="pointer-events-auto w-full max-w-xl overflow-hidden border border-white/10 bg-black outline-none"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-5">
                <div className="space-y-2">
                  <h2 id="wallet-modal-title" className="type-caption uppercase text-white/50">
                    Connect Wallet
                  </h2>
                  <p className="type-body-sm max-w-md text-white/70">
                    Run one command in your terminal, then paste the token here.
                    Read-only, no transactions happen in the browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset touch-manipulation"
                  aria-label="Close wallet connect dialog"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 px-5 py-5">
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="type-caption uppercase text-white/50">Step 1</p>
                      <p className="type-body-sm text-white">Copy the connect command</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadChallenge()}
                      disabled={loadingChallenge || submitting}
                      className="type-caption min-h-11 px-3 text-white/50 transition-colors hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset touch-manipulation"
                    >
                      {loadingChallenge ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {loadingChallenge && !challenge ? (
                    <div className="flex min-h-14 items-center gap-2 border border-white/10 px-4 py-3 text-white/60">
                      <BrailleSpinner name="scan" />
                      <span className="type-body-sm">Generating challenge...</span>
                    </div>
                  ) : challenge ? (
                    <CopyableCodeBlock
                      command={challenge.command}
                      className="border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.05]"
                    />
                  ) : (
                    <div
                      role="alert"
                      className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                    >
                      {challengeError ?? "Could not generate a connect command."}
                    </div>
                  )}

                  <p className="type-caption font-mono tabular-nums text-white/40">
                    {expiryLabel}
                  </p>
                </section>

                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleVerify();
                  }}
                >
                  <div className="space-y-2">
                    <label htmlFor="wallet-connect-token" className="type-caption uppercase text-white/50">
                      Step 2
                    </label>
                    <p className="type-body-sm text-white">
                      Paste the token from `zora auth connect`
                    </p>
                  </div>

                  <textarea
                    id="wallet-connect-token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        void handleVerify();
                      }
                    }}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    placeholder="Paste the full token here"
                    aria-invalid={verifyError ? true : undefined}
                    aria-describedby={verifyError ? "wallet-connect-error" : undefined}
                    className="min-h-36 w-full resize-none border border-white/10 bg-white/[0.03] px-3 py-3 text-base font-mono text-white outline-none transition-colors placeholder:text-white/25 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/15 touch-manipulation"
                  />

                  {verifyError ? (
                    <div
                      id="wallet-connect-error"
                      role="alert"
                      className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                    >
                      {verifyError}
                    </div>
                  ) : (
                    <p className="type-caption text-white/40">
                      Press Cmd+Enter to verify after pasting.
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="type-body-sm min-h-11 px-4 text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!challenge || loadingChallenge || submitting}
                      className="type-body-sm flex min-h-11 min-w-36 items-center justify-center gap-2 bg-white px-4 text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset touch-manipulation"
                    >
                      {submitting && <BrailleSpinner name="scan" />}
                      <span>{submitting ? "Verifying..." : "Verify token"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
