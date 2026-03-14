"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { skills } from "@/lib/skills";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy install command"}
    </Button>
  );
}

export default function SkillsPage() {
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verified Skills</h1>
        <p className="text-sm text-muted-foreground">
          First-party, open-source, read-only. Each skill is a reviewed
          SKILL.md file you install into your OpenClaw agent.
        </p>
      </div>

      <div className="space-y-8">
        {skills.map((skill) => (
          <Card key={skill.id} id={skill.id} className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{skill.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {skill.longDescription}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal text-green-600 dark:text-green-400 shrink-0 ml-4"
                >
                  {skill.riskLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monitors */}
              <div>
                <h3 className="text-sm font-medium mb-2">What it monitors</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {skill.monitors.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CLI commands wrapped */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  CLI commands wrapped
                </h3>
                <div className="space-y-1">
                  {skill.wraps.map((cmd) => (
                    <code
                      key={cmd}
                      className="block text-xs bg-muted px-3 py-1.5 rounded font-mono"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                {skill.badges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>

              <Separator />

              {/* Install */}
              <div>
                <h3 className="text-sm font-medium mb-2">Install</h3>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <code>{skill.installCommand}</code>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CopyButton text={skill.installCommand} />
                  <a
                    href={skill.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    View source
                  </a>
                </div>
              </div>

              <Separator />

              {/* What you'll get */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  What you&apos;ll get after install
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Sample prompt:
                    </p>
                    <div className="bg-muted rounded-lg p-3 text-sm italic">
                      &ldquo;{skill.samplePrompt}&rdquo;
                    </div>
                  </div>
                  <div>
                    <button
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() =>
                        setExpandedOutput(
                          expandedOutput === skill.id ? null : skill.id
                        )
                      }
                    >
                      {expandedOutput === skill.id ? "Hide" : "Show"} example
                      output
                    </button>
                    {expandedOutput === skill.id && (
                      <pre className="mt-2 bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap">
                        {skill.sampleOutput}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
