"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
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

function useTypewriter(text: string, active: boolean, speed = 12) {
  const [count, setCount] = useState(0);
  const hasPlayedRef = useRef(false);

  // Derive displayed/done from count + active without extra state
  const displayed = active ? text.slice(0, count) : "";
  const done = active && count >= text.length;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- animation effect: typewriter ticks */
    if (!active) {
      setCount(0);
      return;
    }
    if (hasPlayedRef.current) {
      setCount(text.length);
      return;
    }
    hasPlayedRef.current = true;
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, text, speed]);

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
  "h-48 overflow-y-auto border border-border bg-foreground/5 px-4 py-3 font-mono text-[0.8125rem] text-foreground/80 whitespace-pre-wrap break-all";
const EXAMPLE_PLACEHOLDER_CLASS =
  "h-48 border border-dashed border-border/80 bg-foreground/[0.02] px-4 py-3";

function formatBadgeLabel(badge: string) {
  switch (badge) {
    case "Creator coins":
      return "Creator coin";
    case "No wallet":
    case "Wallet optional":
      return "No wallet required";
    case "Wallet needed":
      return "Wallet required";
    default:
      return badge;
  }
}

function TerminalOutput({
  id,
  displayed,
  active,
  typingDone,
}: {
  id: string;
  displayed: string;
  active: boolean;
  typingDone: boolean;
}) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [displayed]);

  return (
    <pre ref={ref} id={id} className={EXAMPLE_BLOCK_CLASS}>
      <HighlightedCodeText text={displayed} variant="output" />
      {active && !typingDone ? <span className="animate-blink">&#9608;</span> : null}
    </pre>
  );
}

function SkillRowDetails({
  outputId,
  exampleId,
  displayed,
  active,
  typingDone,
  exampleExpanded,
  onToggleExample,
}: {
  outputId: string;
  exampleId: string;
  displayed: string;
  active: boolean;
  typingDone: boolean;
  exampleExpanded: boolean;
  onToggleExample: () => void;
}) {
  return (
    <div>
      {exampleExpanded ? (
        <div id={exampleId}>
          <TerminalOutput
            id={outputId}
            displayed={displayed}
            active={active}
            typingDone={typingDone}
          />
        </div>
      ) : (
        <button
          id={exampleId}
          type="button"
          className={cn(
            EXAMPLE_PLACEHOLDER_CLASS,
            "flex w-full items-center justify-center overflow-hidden whitespace-normal break-normal text-center transition-[background-color,border-color] duration-150 ease-out hover:bg-foreground/[0.035] hover:border-foreground/20",
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
    <div className="max-w-2xl">
      <Tabs
        value={runtime}
        onValueChange={(value) => onChange(value as Runtime)}
        className="w-full gap-0"
      >
        <div className="border border-border border-b-0 bg-muted p-1">
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
        prefix={runtime === "prompt" ? ">" : "$"}
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
      className="scroll-mt-32 py-6 sm:py-8"
      id={skill.id}
    >
      {index !== 0 && (
        <div
          aria-hidden="true"
          className="-mt-6 mb-6 w-full border-t border-border/80 sm:-mt-8 sm:mb-8"
        />
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-10">
        <div className="space-y-3">
          <h2 className="type-title leading-[0.98]">
            {`${String(index + 1).padStart(2, "0")}. ${skill.name}`}
          </h2>
          <p className="type-body-sm text-muted-foreground">
            {skill.longDescription}
          </p>

          {skill.badges.length > 0 ? (
            <p className="font-display text-[0.9rem] leading-[1.1] tracking-[0.04em] text-muted-foreground/78">
              {skill.badges.map(formatBadgeLabel).join(", ")}
            </p>
          ) : null}

          <CopyableCodeBlock
            command={command}
            prefix={runtime === "prompt" ? ">" : "$"}
          />

          <div className="type-caption flex flex-wrap items-center gap-4 font-mono text-muted-foreground">
            <a
              href={skill.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Source
              <ArrowUpRightIcon size={12} />
            </a>
          </div>

        </div>

        <SkillRowDetails
          outputId={`${detailsId}-desktop-output`}
          exampleId={`${detailsId}-desktop-example`}
          displayed={displayed}
          active={exampleActive}
          typingDone={typingDone}
          exampleExpanded={expandedExample}
          onToggleExample={handleToggleExample}
        />
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
    initialValue: "claude",
    parse: (stored) => (isRuntime(stored) ? stored : "claude"),
    serialize: (value) => value,
  });

  return (
    <div className="w-full">
      {/* Hero: heading + unified install card */}
      <section className="space-y-6 mb-12">
        <h1 className="type-display max-w-5xl pt-[0.06em] leading-[0.94]">
          Six skills for the Zora attention market.
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
          <div className="space-y-3">
            <p className="type-body-sm text-muted-foreground">
              Send this to your agent. Installs the Zora CLI and all skills
              below.
            </p>
            <RuntimeInstallCard
              runtime={runtime}
              onChange={setRuntime}
              command={getInstallAllCommands(getSiteUrl())[runtime]}
            />
          </div>
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
    </div>
  );
}
