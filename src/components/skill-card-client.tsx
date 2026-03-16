"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSkillInstallCommands, type Skill } from "@/lib/skills";

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
      className="min-h-[44px] min-w-16 px-2 text-xs font-mono text-background/60 transition-colors hover:text-background"
      aria-label={copied ? "Copied command" : "Copy command"}
      aria-live="polite"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InstallBlock({ skill }: { skill: Skill }) {
  const commands = getSkillInstallCommands(skill);

  return (
    <div className="overflow-hidden border border-foreground/10 bg-foreground text-background">
      <Tabs defaultValue="claude">
        <div className="flex items-center justify-between gap-3 border-b border-background/10 px-4">
          <TabsList className="h-11 bg-transparent p-0">
            <TabsTrigger
              value="claude"
              className="text-background/50 data-active:bg-transparent data-active:text-background hover:text-background dark:data-active:border-transparent dark:data-active:bg-transparent dark:text-background/50 dark:hover:text-background"
            >
              Claude Code
            </TabsTrigger>
            <TabsTrigger
              value="openclaw"
              className="text-background/50 data-active:bg-transparent data-active:text-background hover:text-background dark:data-active:border-transparent dark:data-active:bg-transparent dark:text-background/50 dark:hover:text-background"
            >
              OpenClaw
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="text-background/50 data-active:bg-transparent data-active:text-background hover:text-background dark:data-active:border-transparent dark:data-active:bg-transparent dark:text-background/50 dark:hover:text-background"
            >
              Manual
            </TabsTrigger>
          </TabsList>
          <a
            href={skill.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 text-xs font-mono text-background/40 transition-colors hover:text-background"
          >
            View source
          </a>
        </div>

        <TabsContent value="claude" className="p-4">
          <div className="flex items-center justify-between gap-4">
            <code className="text-sm font-mono break-all">
              <span className="text-background/40">$ </span>
              {commands.claude}
            </code>
            <CopyButton text={commands.claude} />
          </div>
        </TabsContent>

        <TabsContent value="openclaw" className="p-4">
          <div className="flex items-center justify-between gap-4">
            <code className="text-sm font-mono break-all">
              {commands.openclaw}
            </code>
            <CopyButton text={commands.openclaw} />
          </div>
        </TabsContent>

        <TabsContent value="manual" className="p-4">
          <div className="flex items-center justify-between gap-4">
            <code className="text-sm font-mono break-all">
              <span className="text-background/40">$ </span>
              {commands.manual}
            </code>
            <CopyButton text={commands.manual} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SkillInstallBlock({ skill }: { skill: Skill }) {
  return <InstallBlock skill={skill} />;
}

export function SkillSampleOutput({ skill }: { skill: Skill }) {
  const [expandedOutput, setExpandedOutput] = useState(false);
  const outputId = useId();

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">What you&apos;ll get after install</h3>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Sample prompt:</p>
          <div className="bg-muted p-3 text-sm italic">
            &ldquo;{skill.samplePrompt}&rdquo;
          </div>
        </div>
        <div>
          <button
            type="button"
            className="min-h-[44px] text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={expandedOutput}
            aria-controls={outputId}
            onClick={() => setExpandedOutput((value) => !value)}
          >
            {expandedOutput ? "Hide" : "Show"} example output
          </button>
          {expandedOutput ? (
            <pre
              id={outputId}
              className="mt-2 overflow-x-auto bg-muted p-4 text-xs font-mono whitespace-pre-wrap"
            >
              {skill.sampleOutput}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
