"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AnimatedExternalLink } from "@/components/animated-external-link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { HighlightedCodeText } from "@/components/highlighted-code-text";
import { useSessionStorageState } from "@/hooks/use-session-storage-state";
import {
  getInstallAllCommands,
  getSkillRuntimeCommands,
  type Runtime,
  type Skill,
} from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { AddSkillModal } from "@/components/add-skill-modal";
import { PlusIcon, type PlusIconHandle } from "@/components/ui/plus";

const PAUSE_CHAR = "\u200B";
const PAUSE_MS = 300;

function useTypewriter(text: string, active: boolean, speed = 12, delay = 900) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const hasPlayedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const displayed = active && started
    ? text.slice(0, count).replaceAll(PAUSE_CHAR, "")
    : "";
  const done = active && started && count >= text.length;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- animation effect: typewriter ticks */
    if (!active) {
      setCount(0);
      setStarted(false);
      return;
    }
    if (hasPlayedRef.current) {
      setStarted(true);
      setCount(text.length);
      return;
    }

    function tick(i: number) {
      if (i >= text.length) return;
      const char = text[i];
      if (char === PAUSE_CHAR) {
        // Pause marker — wait longer, don't render it
        timerRef.current = window.setTimeout(() => {
          setCount(i + 1);
          tick(i + 1);
        }, PAUSE_MS);
      } else {
        setCount(i + 1);
        timerRef.current = window.setTimeout(() => tick(i + 1), speed);
      }
    }

    // Delay before starting to type (cursor blinks first)
    const delayTimer = window.setTimeout(() => {
      hasPlayedRef.current = true;
      setStarted(true);
      setCount(0);
      tick(0);
    }, delay);

    return () => {
      window.clearTimeout(delayTimer);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, text, speed, delay]);

  return { displayed, done };
}

const RUNTIME_STORAGE_KEY = "zora:skills-runtime:v3";

const RUNTIMES: Runtime[] = [
  "prompt",
  "claude",
  "openclaw",
  "codex",
  "opencode",
  "cursor",
];

const RUNTIME_LABELS: Record<Runtime, string> = {
  prompt: "Any",
  openclaw: "OpenClaw",
  claude: "Claude Code",
  amp: "Amp",
  codex: "Codex CLI",
  opencode: "OpenCode",
  cursor: "Cursor",
};

const VALID_RUNTIMES = new Set<string>(RUNTIMES);

function isRuntime(value: string | null): value is Runtime {
  return value !== null && VALID_RUNTIMES.has(value);
}

const EXAMPLE_BLOCK_CLASS =
  "h-48 overflow-y-auto border border-white/10 bg-black px-4 py-3 font-mono text-[0.8125rem] text-white/80 whitespace-pre-wrap break-words";

function formatMonitorSummary(monitors: string[]) {
  const summary = monitors
    .slice(0, 3)
    .map((monitor) => {
      const trimmed = monitor.trim();
      return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    });

  if (summary.length === 0) {
    return "";
  }
  if (summary.length === 1) {
    return summary[0];
  }
  if (summary.length === 2) {
    return `${summary[0]} and ${summary[1]}`;
  }

  return `${summary.slice(0, -1).join(", ")}, and ${summary.at(-1)}`;
}

function TerminalOutput({
  id,
  displayed,
  typingDone,
  showCursor,
}: {
  id: string;
  displayed: string;
  typingDone: boolean;
  showCursor: boolean;
}) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [displayed]);

  return (
    <pre ref={ref} id={id} className={EXAMPLE_BLOCK_CLASS}>
      <HighlightedCodeText text={displayed} variant="output" terminal />
      {showCursor && !typingDone ? <span className="animate-blink">&#9608;</span> : null}
    </pre>
  );
}

function SkillRowDetails({
  outputId,
  exampleId,
  displayed,
  typingDone,
  exampleExpanded,
  onToggleExample,
}: {
  outputId: string;
  exampleId: string;
  displayed: string;
  typingDone: boolean;
  exampleExpanded: boolean;
  onToggleExample: () => void;
}) {
  return (
    <div className="flex flex-col justify-end">
      {exampleExpanded ? (
        <div id={exampleId}>
          <TerminalOutput
            id={outputId}
            displayed={displayed}
            typingDone={typingDone}
            showCursor={exampleExpanded}
          />
        </div>
      ) : (
        <button
          id={exampleId}
          type="button"
          className={cn(
            "h-48 border border-dashed border-border/80 px-4 py-3",
            "flex w-full items-center justify-center overflow-hidden whitespace-normal break-normal text-center transition-[border-color] duration-150 ease-out hover:border-foreground/20",
          )}
          aria-expanded="false"
          aria-controls={outputId}
          onClick={onToggleExample}
        >
          <span className="type-label text-muted-foreground transition-colors hover:text-foreground">
            see example
          </span>
        </button>
      )}
    </div>
  );
}

function RuntimeInstallCard({
  runtime,
  onChange,
  command,
}: {
  runtime: Runtime;
  onChange: (runtime: Runtime) => void;
  command: string;
}) {
  return (
    <div>
      <Tabs
        value={runtime}
        onValueChange={(value) => onChange(value as Runtime)}
        className="w-full gap-0"
      >
        <div className="border border-border border-b-0 bg-white p-1">
          <TabsList
            aria-label="Agent runtime"
            className="flex w-full flex-wrap justify-start bg-transparent p-0"
          >
            {RUNTIMES.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className="type-caption sm:min-h-[32px] gap-1.5 px-2.5 py-1"
              >
                <span>{RUNTIME_LABELS[item]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <CopyableCodeBlock
        command={command}
      />
    </div>
  );
}

function SkillRow({
  skill,
  runtime,
  index,
}: {
  skill: Skill;
  runtime: Runtime;
  index: number;
}) {
  const detailsId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const commands = getSkillRuntimeCommands(skill, getSiteUrl());
  const command = commands[runtime];
  const [expandedExample, setExpandedExample] = useState(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(
    typeof IntersectionObserver === "undefined",
  );
  const exampleActive = hasEnteredViewport && expandedExample;
  const monitorSummary = formatMonitorSummary(skill.monitors);

  function handleToggleExample() {
    setExpandedExample((current) => !current);
  }

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || hasEnteredViewport) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { threshold: [0.3] },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  const { displayed, done: typingDone } = useTypewriter(
    skill.sampleOutput ?? "",
    exampleActive,
  );

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-32 py-8 sm:py-12"
      id={skill.id}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-10 lg:min-h-[200px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="type-title leading-[0.98]">
              {`${String(index + 1).padStart(2, "0")}. ${skill.name}`}
            </h2>
            <AnimatedExternalLink
              href={skill.githubUrl}
              iconSize={12}
              className="type-caption shrink-0 gap-1 font-mono text-muted-foreground transition-colors hover:text-foreground"
            >
              Source
            </AnimatedExternalLink>
          </div>
          <div className="space-y-2">
            <p className="type-body-sm text-muted-foreground">
              {skill.longDescription}
              {monitorSummary ? ` Checks ${monitorSummary}.` : ""}
            </p>
            <p>
              <span className="inline bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-muted-foreground">
                Try: &ldquo;{skill.samplePrompt}&rdquo;
              </span>
            </p>
          </div>

          <div className="mt-auto">
            <CopyableCodeBlock
              command={command}
            />
          </div>

        </div>

        <SkillRowDetails
          outputId={`${detailsId}-desktop-output`}
          exampleId={`${detailsId}-desktop-example`}
          displayed={displayed}
          typingDone={typingDone}
          exampleExpanded={expandedExample}
          onToggleExample={handleToggleExample}
        />
      </div>
    </section>
  );
}

function AddSkillCta({ onOpen, skillCount }: { onOpen: () => void; skillCount: number }) {
  const plusRef = useRef<PlusIconHandle>(null);

  return (
    <section className="py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-10 lg:min-h-[200px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="type-title leading-[0.98]">
              {`${String(skillCount + 1).padStart(2, "0")}. Your Skill `}<span role="img" aria-label="pointing at you">🫵</span>
            </h2>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Ship a skill that helps agents scan, trade, or track the Zora attention market.
          </p>
          <div className="mt-auto">
            <button
              type="button"
              onClick={onOpen}
              onMouseEnter={() => plusRef.current?.startAnimation()}
              onMouseLeave={() => plusRef.current?.stopAnimation()}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full gap-2",
              )}
            >
              <PlusIcon ref={plusRef} size={14} />
              Add your skill
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="button"
            className={cn(
              "h-48 border border-dashed border-border/80 px-4 py-3",
              "flex w-full items-center justify-center overflow-hidden whitespace-normal break-normal text-center transition-[border-color] duration-150 ease-out hover:border-foreground/20",
            )}
            onClick={onOpen}
          >
            <span className="type-label text-muted-foreground transition-colors hover:text-foreground">
              what will it do?
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function SkillsInstallList({
  skills,
  children,
}: {
  skills: Skill[];
  children?: React.ReactNode;
}) {
  const orderedSkills = [
    ...skills.filter((skill) => skill.badges.includes("Execution")),
    ...skills.filter((skill) => !skill.badges.includes("Execution")),
  ];
  const [runtime, setRuntime] = useSessionStorageState<Runtime>({
    key: RUNTIME_STORAGE_KEY,
    initialValue: "prompt",
    parse: (stored) => (isRuntime(stored) ? stored : "prompt"),
    serialize: (value) => value,
  });
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const handleOpenAddSkill = useCallback(() => setAddSkillOpen(true), []);
  const handleCloseAddSkill = useCallback(() => setAddSkillOpen(false), []);
  const heroPlusRef = useRef<PlusIconHandle>(null);

  return (
    <div className="w-full">
      {/* Hero: heading + unified install card */}
      <section className="space-y-5 pt-1 pb-20 lg:pb-28 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
          <div className="space-y-5">
            <h1 className="type-display">
              Pick a skill, or grab<br className="hidden lg:inline" />{" "}them all.
            </h1>
            <div className="space-y-3">
              <p className="type-body-sm font-medium text-muted-foreground">
                Six open-source skills for the{" "}
                <a
                  href="https://cli.zora.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors hover:text-foreground"
                >
                  Zora CLI
                </a>
                . One command installs them all.
              </p>
              <RuntimeInstallCard
                runtime={runtime}
                onChange={setRuntime}
                command={getInstallAllCommands(getSiteUrl())[runtime]}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddSkill}
                onMouseEnter={() => heroPlusRef.current?.startAnimation()}
                onMouseLeave={() => heroPlusRef.current?.stopAnimation()}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full gap-2 px-8 sm:w-auto",
                )}
              >
                <PlusIcon ref={heroPlusRef} size={14} />
                Add yours
              </button>
            </div>
          </div>
          {/* Right column: zorb from layout overlays here */}
        </div>
      </section>

      {/* Injected content (e.g. 3-step grid) */}
      {children}

      <div>
        {orderedSkills.map((skill, index) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            runtime={runtime}
            index={index}
          />
        ))}
      </div>

      <AddSkillCta onOpen={handleOpenAddSkill} skillCount={orderedSkills.length} />
      <AddSkillModal open={addSkillOpen} onClose={handleCloseAddSkill} />
    </div>
  );
}
