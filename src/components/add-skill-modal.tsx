"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { SITE_REPO_URL } from "@/lib/site";

interface AddSkillModalProps {
  open: boolean;
  onClose: () => void;
}

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    returnFocusRef.current = document.activeElement as HTMLElement;

    const timer = window.setTimeout(() => {
      containerRef.current?.focus();
    }, 50);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (active) return;
    returnFocusRef.current?.focus();
  }, [active]);
}

const FORK_URL = `${SITE_REPO_URL}/fork`;
const CONTRIBUTING_URL = `${SITE_REPO_URL}/blob/main/CONTRIBUTING.md`;
const TREND_SCOUT_URL = `${SITE_REPO_URL}/tree/main/skills/trend-scout`;

export function AddSkillModal({ open, onClose }: AddSkillModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.2;

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="pointer-events-none relative flex h-full items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-skill-title"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              transition={{ duration }}
              className="pointer-events-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col gap-px overflow-y-auto border border-white/10 bg-white/10 text-white shadow-2xl outline-none"
            >
              <div className="bg-[#090909] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 id="add-skill-title" className="font-display text-2xl tracking-tight sm:text-3xl">
                      Add Your Skill
                    </h2>
                    <p className="type-body-sm text-white/50">
                      Extend the{" "}
                      <a
                        href="https://cli.zora.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline transition-colors hover:text-white"
                      >
                        Zora CLI
                      </a>{" "}
                      with a new capability.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close"
                    className="border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
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
                  </Button>
                </div>
              </div>

              {/* Step 1: Fork & clone */}
              <div className="bg-[#090909] px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="font-display text-4xl font-medium tracking-tight leading-none text-white/20">1</span>
                  <div className="min-w-0 flex-1 space-y-2 pt-1">
                    <h3 className="text-sm font-medium text-white">Fork & clone</h3>
                    <p className="text-sm text-white/50">
                      Start from{" "}
                      <a
                        href={TREND_SCOUT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline transition-colors hover:text-white"
                      >
                        Trend Scout
                        <ArrowUpRightIcon size={12} />
                      </a>
                      {" "}&mdash; the simplest skill.
                    </p>
                    <CopyableCodeBlock
                      command={`git clone ${SITE_REPO_URL}.git`}
                      className="border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07] [&_span]:text-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Add your skill */}
              <div className="bg-[#090909] px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="font-display text-4xl font-medium tracking-tight leading-none text-white/20">2</span>
                  <div className="min-w-0 flex-1 space-y-2 pt-1">
                    <h3 className="text-sm font-medium text-white">Add your skill directory</h3>
                    <p className="text-sm text-white/50">
                      Drop a <code className="rounded bg-white/10 px-1 py-0.5 text-white/80">SKILL.md</code> in <code className="rounded bg-white/10 px-1 py-0.5 text-white/80">skills/your-skill/</code>.{" "}
                      <a
                        href={CONTRIBUTING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline transition-colors hover:text-white"
                      >
                        See the spec
                        <ArrowUpRightIcon size={12} />
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Open a PR */}
              <div className="bg-[#090909] px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="font-display text-4xl font-medium tracking-tight leading-none text-white/20">3</span>
                  <div className="min-w-0 flex-1 space-y-2 pt-1">
                    <h3 className="text-sm font-medium text-white">Open a PR</h3>
                    <p className="text-sm text-white/50">Make sure the merge gate passes.</p>
                    <CopyableCodeBlock
                      command="pnpm lint && pnpm typecheck && pnpm test && pnpm build"
                      className="border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07] [&_span]:text-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Fork CTA */}
              <a
                href={FORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white py-3.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Fork on GitHub
              </a>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    portalTarget,
  );
}
