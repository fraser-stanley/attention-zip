"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AnimatedButton } from "@/components/ui/animated-button";
import { TextMorph } from "@/components/text-morph";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { CheckIcon } from "@/components/ui/check";
import { PlusIcon } from "@/components/ui/plus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { useToast } from "@/components/toast";
import { useExpandableMemory } from "@/hooks/use-expandable-memory";
import { useSessionStorageState } from "@/hooks/use-session-storage-state";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { getSkillInstallCommands, type Skill } from "@/lib/skills";
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

type Method = "cli" | "openclaw" | "manual";

const INSTALL_METHOD_STORAGE_KEY = "zora:skills-install-method";

const INSTALL_METHODS: Method[] = ["cli", "openclaw", "manual"];

const INSTALL_METHOD_LABELS: Record<Method, string> = {
  cli: "Tell your agent",
  openclaw: "OpenClaw",
  manual: "curl",
};

function isMethod(value: string | null): value is Method {
  return value === "cli" || value === "openclaw" || value === "manual";
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
      {!typingDone && (
        <span className="animate-blink">&#9608;</span>
      )}
    </pre>
  );
}

function InstallMethodPicker({
  method,
  onChange,
}: {
  method: Method;
  onChange: (method: Method) => void;
}) {
  return (
    <div className="sticky top-12 z-40 -mx-4 mb-8 bg-background/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-4">
        <Tabs
          value={method}
          onValueChange={(value) => onChange(value as Method)}
          className="w-full gap-0 sm:w-auto"
        >
          <TabsList
            variant="toggle"
            aria-label="Preferred install method"
            className="grid w-full grid-cols-3 sm:w-auto sm:min-w-[22rem]"
          >
            {INSTALL_METHODS.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className="type-body-sm min-h-[44px] px-3 py-2 sm:px-4"
              >
                <span>{INSTALL_METHOD_LABELS[item]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

type InstallState = "idle" | "installing" | "installed";

function InstallButton({
  skill,
  command,
}: {
  skill: Skill;
  command: string;
}) {
  const { isInstalled, install, uninstall, hydrated } = useInstalledSkills();
  const { toast } = useToast();
  const [installing, setInstalling] = useState(false);
  const timerRef = useRef<number | null>(null);
  const installed = hydrated && isInstalled(skill.id);
  const state: InstallState = installing ? "installing" : installed ? "installed" : "idle";

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
      toast(`${skill.name} equipped`);
      timerRef.current = null;
    }, 800);
  }

  function handleUninstall() {
    uninstall(skill.id);
  }

  if (!hydrated) {
    return <div className="h-[44px] w-full max-w-40 border border-border bg-muted/50 animate-pulse" />;
  }

  if (state === "installed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="type-body-sm inline-flex min-h-[44px] items-center gap-2 bg-[#3FFF00] px-4 py-2.5 font-medium text-black">
          <CheckIcon size={14} />
          <TextMorph>Equipped</TextMorph>
        </div>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-red-500/20 text-red-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
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
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      ) : (
        <PlusIcon size={14} />
      )}
      <TextMorph>{state === "installing" ? "Equipping..." : "Equip"}</TextMorph>
    </AnimatedButton>
  );
}

function SkillRow({
  skill,
  method,
  index,
}: {
  skill: Skill;
  method: Method;
  index: number;
}) {
  const outputId = useId();
  const commands = getSkillInstallCommands(skill);
  const command = commands[method];
  const { expanded: expandedOutput, toggleExpanded: toggleOutput } =
    useExpandableMemory(`zora:skill-output:${skill.id}`);
  const isExecution = skill.risk !== "none";
  const { displayed, done: typingDone } = useTypewriter(
    skill.sampleOutput ?? "",
    expandedOutput,
  );

  return (
    <section
      className={cn(
        "scroll-mt-32 py-10 sm:py-14",
        index !== 0 ? "border-t border-border/60" : "",
        ""
      )}
      id={skill.id}
    >
      <div className="max-w-3xl space-y-4">
        {/* Name + description */}
        <h2 className="type-title">{skill.name}</h2>
        <p className="type-body text-muted-foreground">{skill.longDescription}</p>

        {/* Badges — execution skills only */}
        {isExecution && (
          <div className="flex flex-wrap items-center gap-1.5">
            {skill.badges.map((badge) => (
              <Badge
                key={badge}
                variant={badge === "Execution" ? "default" : "outline"}
                className={cn(
                  "type-caption font-normal",
                  badge === "Execution"
                    ? "border-transparent bg-[#FF00F0] text-black"
                    : ""
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Install command */}
        <CopyableCodeBlock command={command} />

        {/* Commands — always visible */}
        <div>
          <p className="type-label mb-2 text-muted-foreground">Commands</p>
          <pre className={PRE_BLOCK_CLASS}>
            {skill.wraps.join("\n")}
          </pre>
        </div>

        {/* Actions: buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <InstallButton skill={skill} command={command} />
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-[7.5rem]",
              "aria-expanded:bg-background aria-expanded:text-foreground aria-expanded:border-foreground"
            )}
            aria-expanded={expandedOutput}
            aria-controls={outputId}
            onClick={toggleOutput}
          >
            {expandedOutput ? "Hide example" : "See example"}
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

        {/* Expandable sample output — fixed-height terminal with auto-scroll */}
        {expandedOutput ? (
          <TerminalOutput id={outputId} displayed={displayed} typingDone={typingDone} />
        ) : null}
      </div>
    </section>
  );
}

export function SkillsInstallList({ skills }: { skills: Skill[] }) {
  const [method, setMethod] = useSessionStorageState<Method>({
    key: INSTALL_METHOD_STORAGE_KEY,
    initialValue: "cli",
    parse: (storedMethod) => (isMethod(storedMethod) ? storedMethod : "cli"),
    serialize: (value) => value,
  });

  return (
    <div className="max-w-5xl">
      <InstallMethodPicker method={method} onChange={setMethod} />

      <div>
        {skills.map((skill, index) => (
          <SkillRow key={skill.id} skill={skill} method={method} index={index} />
        ))}
      </div>
    </div>
  );
}
