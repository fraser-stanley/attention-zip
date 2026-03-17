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

type InstallMethodMeta = {
  value: Method;
  label: string;
  token: string;
  description: string;
};

const INSTALL_METHOD_STORAGE_KEY = "zora:skills-install-method";

const INSTALL_METHODS: InstallMethodMeta[] = [
  {
    value: "cli",
    label: "Zora CLI",
    token: "ZC",
    description: "Install the packaged skill through Zora CLI in one command.",
  },
  {
    value: "openclaw",
    label: "OpenClaw",
    token: "OC",
    description: "Add the Zora CLI integration through OpenClaw's skills workflow.",
  },
  {
    value: "manual",
    label: "Manual",
    token: "MD",
    description: "Fetch the raw SKILL.md when you want to inspect and place it yourself.",
  },
];

function isMethod(value: string | null): value is Method {
  return value === "cli" || value === "openclaw" || value === "manual";
}

function getMethodMeta(method: Method) {
  return INSTALL_METHODS.find((item) => item.value === method) ?? INSTALL_METHODS[0];
}

function badgeClassName(badge: string) {
  return badge === "Execution"
    ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
    : "";
}

function MethodToken({ token }: { token: string }) {
  return (
    <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-border bg-background px-1.5 text-[10px] font-mono uppercase tracking-[0.16em]">
      {token}
    </span>
  );
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
  const currentMethod = getMethodMeta(method);

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Install method
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the command format once. The selection applies to every skill below.
        </p>
      </div>

      <Tabs value={method} onValueChange={(value) => onChange(value as Method)} className="gap-0">
        <TabsList
          variant="line"
          aria-label="Preferred install method"
          className="w-full flex-wrap gap-2 border-b border-border bg-muted/30 px-2 py-2"
        >
          {INSTALL_METHODS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="min-h-[44px] rounded-md px-3 py-2 text-foreground/70 data-active:border-border data-active:bg-background data-active:text-foreground"
            >
              <MethodToken token={item.token} />
              <span>{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MethodToken token={currentMethod.token} />
          <p className="text-sm font-medium">{currentMethod.label}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{currentMethod.description}</p>
      </div>
    </div>
  );
}

function InstallCommandPanel({
  skillName,
  method,
  command,
}: {
  skillName: string;
  method: Method;
  command: string;
}) {
  const methodMeta = getMethodMeta(method);
  const hasHover = useHasHover();

  return (
    <div className="group/install mt-4 overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <MethodToken token={methodMeta.token} />
          <p className="text-sm font-medium">{methodMeta.label}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{methodMeta.description}</p>
      </div>

      <div className="relative p-4">
        <CopyButton
          text={command}
          label={`Copy ${skillName} install command`}
          className={cn(
            "absolute right-6 top-6 z-10",
            hasHover
              ? "opacity-0 transition-opacity duration-200 group-hover/install:opacity-100 focus-visible:opacity-100"
              : ""
          )}
        />
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 pr-16 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
          <code>{command}</code>
        </pre>
      </div>
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  const outputId = useId();
  const { expanded: expandedOutput, toggleExpanded: toggleOutput } =
    useExpandableMemory(`zora:skill-output:${skill.id}`);

  return (
    <div className="mt-4 space-y-6 border-t border-border/70 pt-5">
      <p className="text-sm text-muted-foreground">{skill.longDescription}</p>

      <div>
        <h3 className="mb-2 text-sm font-medium">What it monitors</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {skill.monitors.map((monitor) => (
            <li key={monitor} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              {monitor}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">CLI commands wrapped</h3>
        <div className="space-y-1.5">
          {skill.wraps.map((command) => (
            <code
              key={command}
              className="block rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-mono"
            >
              {command}
            </code>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {skill.badges.map((badge) => (
          <Badge
            key={badge}
            variant={badge === "Execution" ? "default" : "outline"}
            className={cn("text-xs font-normal", badgeClassName(badge))}
          >
            {badge}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Sample prompt</p>
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm italic">
            &ldquo;{skill.samplePrompt}&rdquo;
          </div>
        </div>

        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          aria-expanded={expandedOutput}
          aria-controls={outputId}
          onClick={toggleOutput}
        >
          {expandedOutput ? "Hide" : "Show"} example output
          <ChevronDownIcon
            size={12}
            className={`transition-transform duration-200 ${expandedOutput ? "rotate-180" : ""}`}
          />
        </button>

        {expandedOutput ? (
          <pre
            id={outputId}
            className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono whitespace-pre-wrap"
          >
            {skill.sampleOutput}
          </pre>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
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
    return <div className="mt-4 h-[44px] rounded-md border border-border bg-muted/50 animate-pulse" />;
  }

  if (state === "installed") {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#3FFF00] px-4 py-2.5 text-sm font-medium text-black">
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
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground"
      >
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
        Installing...
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
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
}: {
  skill: Skill;
  method: Method;
}) {
  const detailId = useId();
  const commands = getSkillInstallCommands(skill);
  const command = commands[method];
  const { expanded, toggleExpanded } = useExpandableMemory(`zora:skill-detail:${skill.id}`);

  return (
    <section className="scroll-mt-20 border-t border-border/80 py-8 first:border-t-0" id={skill.id}>
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">{skill.name}</h2>
          <p className="text-sm text-muted-foreground">{skill.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-normal",
              skill.risk === "medium"
                ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
                : ""
            )}
          >
            {skill.riskLabel}
          </Badge>
          {skill.badges.map((badge) => (
            <Badge
              key={badge}
              variant={badge === "Execution" ? "default" : "outline"}
              className={cn("text-xs font-normal", badgeClassName(badge))}
            >
              {badge}
            </Badge>
          ))}
        </div>
      </div>

      <InstallCommandPanel skillName={skill.name} method={method} command={command} />
      <InstallButton skill={skill} command={command} />

      <div className="mt-4">
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={toggleExpanded}
        >
          {expanded ? "Hide details" : "Show details"}
          <ChevronDownIcon
            size={12}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
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
    <div className="max-w-3xl">
      <InstallMethodPicker method={method} onChange={setMethod} />

      <div>
        {skills.map((skill) => (
          <SkillRow key={skill.id} skill={skill} method={method} />
        ))}
      </div>
    </div>
  );
}
