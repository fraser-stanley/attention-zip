"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextMorph } from "@/components/text-morph";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { useToast } from "@/components/toast";
import type { Skill } from "@/lib/skills";

interface SkillCardProps {
  skill: Skill;
  href?: string;
}

export function SkillCard({ skill, href }: SkillCardProps) {
  const { isInstalled, install, uninstall } = useInstalledSkills();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "installing">("idle");
  const installed = isInstalled(skill.id);

  function handleInstall(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setState("installing");
    setTimeout(() => {
      install(skill.id);
      toast(`${skill.name} added to your agent`);
      setState("idle");
    }, 800);
  }

  function handleUninstall(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    uninstall(skill.id);
  }

  return (
    <div className="relative">
      {href && (
        <Link href={href} className="peer/link absolute inset-0 z-0" aria-label={skill.name} />
      )}
      <Card className="h-full transition-[background-color,color,border-color] duration-150 peer-hover/link:border-foreground peer-hover/link:bg-foreground peer-hover/link:text-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{skill.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-3">
          <p className="text-sm text-muted-foreground peer-hover/link:text-background/70">
            {skill.description}
          </p>
          <div className="flex items-center justify-end pt-1">
            <div className="relative z-10">
              {installed ? (
                <button
                  type="button"
                  className="group/btn inline-flex h-7 items-center rounded-md border px-3 text-xs font-medium transition-colors hover:border-transparent hover:bg-[#FF00F0] hover:text-black"
                  onClick={handleUninstall}
                >
                  <span className="group-hover/btn:hidden">Installed</span>
                  <span className="hidden group-hover/btn:inline">Remove</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-7 items-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                  disabled={state === "installing"}
                  onClick={state === "idle" ? handleInstall : undefined}
                >
                  <TextMorph>{state === "installing" ? "Installing..." : "Install"}</TextMorph>
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
