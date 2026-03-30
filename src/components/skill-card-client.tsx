"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { useExpandableMemory } from "@/hooks/use-expandable-memory";
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
  "amp",
  "codex",
  "opencode",
  "cursor",
];

const RUNTIME_LABELS: Record<Runtime, string> = {
  prompt: "Any Agent",
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

const PRE_BLOCK_CLASS =
  "border border-border bg-foreground/5 px-4 py-3 font-mono text-sm text-foreground/80 whitespace-pre-wrap break-all";

function TerminalOutput({
  id,
  displayed,
  typingDone,
}: {
  id: string;
  displayed: string;
  typingDone: boolean;
}) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [displayed]);

  return (
    <pre
      ref={ref}
      id={id}
      className={`h-64 overflow-y-auto ${PRE_BLOCK_CLASS}`}
    >
      {displayed}
      {!typingDone && <span className="animate-blink">&#9608;</span>}
    </pre>
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
  const commands = getSkillRuntimeCommands(skill, getSiteUrl());
  const command = commands[runtime];
  const { expanded: expandedDetails, toggleExpanded: toggleDetails } =
    useExpandableMemory(`zora:skill-output:${skill.id}`);
  const { displayed, done: typingDone } = useTypewriter(
    skill.sampleOutput ?? "",
    expandedDetails,
  );

  return (
    <section className="scroll-mt-32 py-10 sm:py-14" id={skill.id}>
      {index !== 0 && (
        <p
          aria-hidden="true"
          className="type-caption -mt-10 mb-10 select-none text-border tracking-[0.35em] sm:-mt-14 sm:mb-14"
        >
          {"- ".repeat(40).trim()}
        </p>
      )}
      <div className="max-w-3xl space-y-4">
        {/* Name + description */}
        <h2 className="type-title">{skill.name}</h2>
        <p className="type-body text-muted-foreground">
          {skill.longDescription}
        </p>

        {/* Badges */}
        {skill.badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {skill.badges.map((badge) => (
              <Badge
                key={badge}
                variant={badge === "Execution" ? "default" : "outline"}
                className={cn(
                  "type-caption font-normal",
                  badge === "Execution"
                    ? "border-transparent bg-[#FF00F0] text-black"
                    : "",
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        <CopyableCodeBlock command={command} prefix={runtime === "prompt" ? ">" : "$"} />

        {/* Actions: buttons */}
        <div className="flex flex-wrap items-center">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:border-foreground",
            )}
            aria-expanded={expandedDetails}
            aria-controls={detailsId}
            onClick={toggleDetails}
          >
            {expandedDetails ? "Less info" : "More info"}
          </button>
        </div>

        {/* Links: separate row */}
        <div className="type-caption flex items-center gap-4 font-mono text-muted-foreground">
          <a
            href={skill.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Source
            <ArrowUpRightIcon size={12} />
          </a>
          <a
            href={skill.skillMdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Skill notes
            <ArrowUpRightIcon size={12} />
          </a>
        </div>

        {expandedDetails ? (
          <div id={detailsId} className="space-y-4">
            <div>
              <p className="type-label mb-2 text-muted-foreground">Commands</p>
              <pre className={PRE_BLOCK_CLASS}>{skill.commands.join("\n")}</pre>
            </div>
            <div>
              <p className="type-label mb-2 text-muted-foreground">
                Example output
              </p>
              <TerminalOutput
                id={`${detailsId}-output`}
                displayed={displayed}
                typingDone={typingDone}
              />
            </div>
          </div>
        ) : null}
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
  const [runtime, setRuntime] = useSessionStorageState<Runtime>({
    key: RUNTIME_STORAGE_KEY,
    initialValue: "claude",
    parse: (stored) => (isRuntime(stored) ? stored : "claude"),
    serialize: (value) => value,
  });

  return (
    <div className="max-w-5xl">
      {/* Hero: heading + unified install card */}
      <section className="space-y-6 mb-12">
        <h1 className="type-display max-w-5xl pt-[0.06em] leading-[0.94]">
          Install Zora market skills.
        </h1>
        <div className="max-w-2xl space-y-3">
          <p className="type-caption font-mono text-muted-foreground">
            Paste this to your agent.
          </p>
          <RuntimeInstallCard
            runtime={runtime}
            onChange={setRuntime}
            command={getInstallAllCommands(getSiteUrl())[runtime]}
          />
          <p className="type-body-sm text-muted-foreground">
            Installs all six skills. Or pick one below.
          </p>
        </div>
      </section>

      {/* Injected content (e.g. 3-step grid) */}
      {children}

      <div>
        {skills.map((skill, index) => (
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
