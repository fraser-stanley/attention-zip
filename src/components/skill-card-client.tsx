"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getSkillInstallCommands, type Skill } from "@/lib/skills";
import { CopyIcon } from "@/components/ui/copy";
import { CheckIcon } from "@/components/ui/check";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { PlusIcon } from "@/components/ui/plus";
import { buttonVariants } from "@/components/ui/button-variants";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { useToast } from "@/components/toast";

type Method = "cli" | "openclaw" | "manual";

function CopyButton({ text }: { text: string }) {
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
      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      aria-label={copied ? "Copied command" : "Copy command"}
      aria-live="polite"
    >
      {copied ? (
        <CheckIcon size={16} />
      ) : (
        <CopyIcon size={16} />
      )}
    </button>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  const [expandedOutput, setExpandedOutput] = useState(false);
  const outputId = useId();

  return (
    <div className="mt-4 space-y-6 pt-4">
      <p className="text-sm text-muted-foreground">{skill.longDescription}</p>

      <div>
        <h3 className="text-sm font-medium mb-2">What it monitors</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          {skill.monitors.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              {m}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">CLI commands wrapped</h3>
        <div className="space-y-1.5">
          {skill.wraps.map((cmd) => (
            <code
              key={cmd}
              className="block text-xs rounded-md border border-border bg-muted/50 px-3 py-2 font-mono"
            >
              {cmd}
            </code>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {skill.badges.map((badge) => (
          <Badge
            key={badge}
            variant={badge === "Execution" ? "default" : "outline"}
            className={`text-xs font-normal ${badge === "Execution" ? "bg-amber-500/15 text-amber-500 border-amber-500/25" : ""}`}
          >
            {badge}
          </Badge>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Sample prompt:</p>
        <div className="rounded-md border border-border bg-muted/50 p-3 text-sm italic">
          &ldquo;{skill.samplePrompt}&rdquo;
        </div>
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          aria-expanded={expandedOutput}
          aria-controls={outputId}
          onClick={() => setExpandedOutput((v) => !v)}
        >
          {expandedOutput ? "Hide" : "Show"} example output
          <ChevronDownIcon size={12} className={`transition-transform duration-200 ${expandedOutput ? "rotate-180" : ""}`} />
        </button>
        {expandedOutput ? (
          <pre
            id={outputId}
            className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/50 p-4 text-xs font-mono whitespace-pre-wrap"
          >
            {skill.sampleOutput}
          </pre>
        ) : null}
      </div>

      <a
        href={skill.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
      >
        View source
        <ArrowUpRightIcon size={12} />
      </a>
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
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const installed = hydrated && isInstalled(skill.id);
  const state: InstallState = installing ? "installing" : installed ? "installed" : "idle";

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
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
    setHovered(false);
  }

  if (!hydrated) {
    return (
      <div className="mt-4 h-[44px] rounded-md border border-border bg-muted/50 animate-pulse" />
    );
  }

  if (state === "installed") {
    return (
      <button
        type="button"
        className="mt-4 min-h-[44px] inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors bg-[#3FFF00] text-black hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleUninstall}
      >
        {hovered ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            Remove
          </>
        ) : (
          <>
            <CheckIcon size={14} />
            Installed
          </>
        )}
      </button>
    );
  }

  if (state === "installing") {
    return (
      <button
        type="button"
        disabled
        className="mt-4 min-h-[44px] inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground"
      >
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
        Installing...
      </button>
    );
  }

  return (
    <button
      type="button"
      className="mt-4 min-h-[44px] inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
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
  expanded,
  onToggle,
}: {
  skill: Skill;
  method: Method;
  expanded: boolean;
  onToggle: () => void;
}) {
  const commands = getSkillInstallCommands(skill);
  const command = commands[method];
  const detailId = useId();

  return (
    <div className="py-8" id={skill.id}>
      <div>
        <h2 className="text-lg font-medium">{skill.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {skill.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-4 py-3">
        <code className="text-sm font-mono break-all text-foreground">
          {command}
        </code>
        <CopyButton text={command} />
      </div>

      <InstallButton skill={skill} command={command} />

      <div>
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={onToggle}
        >
          {expanded ? "Hide details" : "Details"}
          <ChevronDownIcon size={12} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div id={detailId}>
          <SkillDetail skill={skill} />
        </div>
      )}
    </div>
  );
}

export function SkillsInstallList({ skills }: { skills: Skill[] }) {
  const [method, setMethod] = useState<Method>("cli");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="max-w-2xl">
      <Tabs
        value={method}
        onValueChange={(v) => setMethod(v as Method)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="cli">Zora CLI</TabsTrigger>
          <TabsTrigger value="openclaw">OpenClaw</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        {skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            method={method}
            expanded={expanded.has(skill.id)}
            onToggle={() => toggleExpanded(skill.id)}
          />
        ))}
      </div>
    </div>
  );
}

