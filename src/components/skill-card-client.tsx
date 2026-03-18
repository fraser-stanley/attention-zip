"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { CheckIcon } from "@/components/ui/check";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { CopyIcon } from "@/components/ui/copy";
import { PlusIcon } from "@/components/ui/plus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/toast";
import { useExpandableMemory } from "@/hooks/use-expandable-memory";
import { useHasHover } from "@/hooks/use-has-hover";
import { useSessionStorageState } from "@/hooks/use-session-storage-state";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { getSkillInstallCommands, type Skill } from "@/lib/skills";
import { cn } from "@/lib/utils";

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

function badgeClassName(badge: string) {
  return badge === "Execution"
    ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
    : "";
}

function CopyButton({
  text,
  className,
  label = "Copy command",
}: {
  text: string;
  className?: string;
  label?: string;
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
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
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
      aria-label={copied ? "Copied command" : label}
      aria-live="polite"
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </button>
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
    <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <p className="type-label text-muted-foreground">Install flow</p>
        <p className="type-body-sm max-w-xl text-muted-foreground">
          Pick a runtime. Every command below updates to match, and the
          choice sticks for this session.
        </p>
      </div>

      <Tabs
        value={method}
        onValueChange={(value) => onChange(value as Method)}
        className="w-full gap-0 lg:w-auto"
      >
        <TabsList
          variant="line"
          aria-label="Preferred install method"
          className="grid w-full grid-cols-3 gap-1 bg-muted p-1 lg:w-auto lg:min-w-[22rem]"
        >
          {INSTALL_METHODS.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              className="type-body-sm min-h-[44px] rounded-none border-none bg-transparent px-3 py-3 font-medium text-muted-foreground hover:bg-background hover:text-foreground data-active:bg-background data-active:text-foreground lg:px-4"
            >
              <span>{INSTALL_METHOD_LABELS[item]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function InstallCommandPanel({
  skillName,
  command,
}: {
  skillName: string;
  command: string;
}) {
  const hasHover = useHasHover();

  return (
    <div className="group/install relative">
      <CopyButton
        text={command}
        label={`Copy ${skillName} install command`}
        className={cn(
          "absolute right-2 top-2 z-10",
          hasHover
            ? "opacity-0 transition-opacity duration-150 group-hover/install:opacity-100 focus-visible:opacity-100"
            : ""
        )}
      />
      <pre className="type-body-sm overflow-x-auto bg-muted/40 p-4 pr-14 font-mono whitespace-pre-wrap break-all sm:p-5 sm:pr-16">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  const outputId = useId();
  const { expanded: expandedOutput, toggleExpanded: toggleOutput } =
    useExpandableMemory(`zora:skill-output:${skill.id}`);

  return (
    <div className="mt-6 grid gap-6 border-t border-border/70 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="type-label mb-3 text-muted-foreground">What it monitors</h3>
          <ul className="type-body-sm space-y-1.5 text-muted-foreground">
            {skill.monitors.map((monitor) => (
              <li key={monitor} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                {monitor}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="type-label mb-3 text-muted-foreground">Commands wrapped</h3>
          <div className="space-y-1.5">
            {skill.wraps.map((command) => (
              <code
                key={command}
                className="type-caption block border border-border bg-muted/40 px-3 py-2 font-mono break-all"
              >
                {command}
              </code>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="type-label mb-2 text-muted-foreground">Sample prompt</p>
          <div className="type-body-sm border border-border bg-muted/40 p-3 italic">
            &ldquo;{skill.samplePrompt}&rdquo;
          </div>
        </div>

        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "type-body-sm h-auto px-0 text-foreground hover:bg-transparent"
          )}
          aria-expanded={expandedOutput}
          aria-controls={outputId}
          onClick={toggleOutput}
        >
          {expandedOutput ? "Hide example output" : "Show example output"}
          <ChevronDownIcon
            size={12}
            className={`transition-transform duration-200 ${expandedOutput ? "rotate-180" : ""}`}
          />
        </button>

        {expandedOutput ? (
          <pre
            id={outputId}
            className="type-caption overflow-x-auto border border-border bg-muted/40 p-4 font-mono whitespace-pre-wrap"
          >
            {skill.sampleOutput}
          </pre>
        ) : null}
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
      toast(`${skill.name} added to your agent`);
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
          Installed
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

  if (state === "installing") {
    return (
      <button
        type="button"
        disabled
        className="type-body-sm inline-flex min-h-[44px] w-full items-center justify-center gap-2 border border-border px-4 py-2.5 font-medium text-muted-foreground sm:w-auto"
      >
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
        Installing...
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
      onClick={handleInstall}
    >
      <PlusIcon size={14} />
      Install
    </button>
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
  const detailId = useId();
  const commands = getSkillInstallCommands(skill);
  const command = commands[method];
  const { expanded, toggleExpanded } = useExpandableMemory(`zora:skill-detail:${skill.id}`);

  return (
    <section
      className={cn(
        "scroll-mt-24 py-10 sm:py-12",
        index !== 0 ? "border-t border-border/60" : ""
      )}
      id={skill.id}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)] lg:gap-12">
        <div className="space-y-5">
          <p className="type-label text-muted-foreground">Skill {String(index + 1).padStart(2, "0")}</p>

          <div className="space-y-2">
            <h2 className="type-section">{skill.name}</h2>
            <p className="type-body max-w-2xl text-muted-foreground">
              {skill.description}
            </p>
          </div>

          <p className="type-body max-w-2xl text-muted-foreground">
            {skill.longDescription}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {skill.badges.map((badge) => (
              <Badge
                key={badge}
                variant={badge === "Execution" ? "default" : "outline"}
                className={cn("type-caption font-normal", badgeClassName(badge))}
              >
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <InstallCommandPanel skillName={skill.name} command={command} />
          <div className="flex flex-wrap items-center gap-3">
            <InstallButton skill={skill} command={command} />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "type-body-sm h-auto px-0 text-foreground hover:bg-transparent"
              )}
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={toggleExpanded}
            >
              {expanded ? "Hide details" : "Inspect details"}
              <ChevronDownIcon
                size={12}
                className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="type-caption flex flex-wrap items-center gap-4 font-mono text-muted-foreground">
            <a
              href={skill.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              View source
              <ArrowUpRightIcon size={12} />
            </a>
            <a
              href={skill.skillMdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Raw SKILL.md
              <ArrowUpRightIcon size={12} />
            </a>
          </div>
        </div>
      </div>

      {expanded ? (
        <div id={detailId}>
          <SkillDetail skill={skill} />
        </div>
      ) : null}
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
