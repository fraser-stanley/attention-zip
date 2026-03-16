"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getSkillInstallCommands, type Skill } from "@/lib/skills";

type Method = "claude" | "openclaw" | "manual";

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
      className="shrink-0 p-2 text-muted-foreground/60 transition-colors hover:text-foreground"
      aria-label={copied ? "Copied command" : "Copy command"}
      aria-live="polite"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
          <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
        </svg>
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
          <Badge key={badge} variant="outline" className="text-xs font-normal">
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
          className="mt-3 min-h-[44px] text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={expandedOutput}
          aria-controls={outputId}
          onClick={() => setExpandedOutput((v) => !v)}
        >
          {expandedOutput ? "Hide" : "Show"} example output
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
        className="inline-block text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
      >
        View source
      </a>
    </div>
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

      <button
        type="button"
        className="mt-3 min-h-[44px] text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
      >
        {expanded ? "Hide details" : "Details"}
      </button>

      {expanded && (
        <div id={detailId}>
          <SkillDetail skill={skill} />
        </div>
      )}
    </div>
  );
}

export function SkillsInstallList({ skills }: { skills: Skill[] }) {
  const [method, setMethod] = useState<Method>("claude");
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
          <TabsTrigger value="claude">Claude Code</TabsTrigger>
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

