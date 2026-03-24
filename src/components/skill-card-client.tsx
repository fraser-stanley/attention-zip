"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AnimatedButton } from "@/components/ui/animated-button";
import { BrailleSpinner } from "@/components/ui/braille-spinner";
import { TextMorph } from "@/components/text-morph";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { CheckIcon } from "@/components/ui/check";
import { CopyIcon } from "@/components/ui/copy";
import { PlusIcon } from "@/components/ui/plus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { useToast } from "@/components/toast";
import { useExpandableMemory } from "@/hooks/use-expandable-memory";
import { useSessionStorageState } from "@/hooks/use-session-storage-state";
import { useInstalledSkills } from "@/lib/installed-skills-context";
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

const RUNTIME_STORAGE_KEY = "zora:skills-runtime:v2";

const RUNTIMES: Runtime[] = [
  "claude",
  "openclaw",
  "amp",
  "codex",
  "opencode",
  "cursor",
];

const RUNTIME_LABELS: Record<Runtime, string> = {
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
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      return;
    }
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl border border-border">
      {/* Header: runtime tabs */}
      <Tabs
        value={runtime}
        onValueChange={(value) => onChange(value as Runtime)}
        className="w-full gap-0"
      >
        <div className="border-b border-border bg-muted p-1">
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

      {/* Body: command + copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="group flex w-full items-center gap-3 bg-foreground/5 px-4 py-3.5 font-mono text-sm transition-colors hover:bg-foreground/[0.07]"
        title={copied ? "Copied" : "Copy command"}
        aria-live="polite"
      >
        <span className="text-foreground/40">$</span>
        <span className="flex-1 truncate text-left text-foreground/80">
          {command}
        </span>
        <span className="shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground/60">
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </span>
      </button>
    </div>
  );
}

type InstallState = "idle" | "installing" | "installed";

function InstallButton({ skill, command }: { skill: Skill; command: string }) {
  const { isInstalled, install, uninstall, hydrated } = useInstalledSkills();
  const { toast } = useToast();
  const [installing, setInstalling] = useState(false);
  const timerRef = useRef<number | null>(null);
  const installed = hydrated && isInstalled(skill.id);
  const state: InstallState = installing
    ? "installing"
    : installed
      ? "installed"
      : "idle";

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleInstall() {
    navigator.clipboard.writeText(command).catch(() => {});
    setInstalling(true);
    timerRef.current = window.setTimeout(() => {
      install(skill.id);
      setInstalling(false);
      toast(`${skill.name} installed`);
      timerRef.current = null;
    }, 800);
  }

  function handleUninstall() {
    uninstall(skill.id);
  }

  if (!hydrated) {
    return (
      <div className="h-[44px] w-full max-w-40 border border-border bg-muted/50 animate-pulse" />
    );
  }

  if (state === "installed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="type-body-sm inline-flex min-h-[44px] items-center gap-2 bg-[#3FFF00] px-4 py-2.5 font-medium text-black">
          <CheckIcon size={14} />
          <TextMorph>Installed</TextMorph>
        </div>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-red-500/20 text-red-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500",
          )}
          onClick={handleUninstall}
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <AnimatedButton
      variant={state === "installing" ? "outline" : "default"}
      className="w-full sm:w-auto"
      disabled={state === "installing"}
      onClick={state === "idle" ? handleInstall : undefined}
    >
      {state === "installing" ? (
        <BrailleSpinner name="scan" className="text-sm" />
      ) : (
        <PlusIcon size={14} />
      )}
      <TextMorph>
        {state === "installing" ? "Installing..." : "Install"}
      </TextMorph>
    </AnimatedButton>
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

        {/* Install command */}
        <CopyableCodeBlock command={command} />

        {/* Actions: buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <InstallButton skill={skill} command={command} />
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-[7.5rem]",
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
            SKILL.md
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
        <RuntimeInstallCard
          runtime={runtime}
          onChange={setRuntime}
          command={getInstallAllCommands(getSiteUrl())[runtime]}
        />
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
