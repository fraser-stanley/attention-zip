"use client";

import { useState } from "react";
import { TextMorph } from "@/components/text-morph";
import { AnimatedButton } from "@/components/ui/animated-button";
import { PlusIcon } from "@/components/ui/plus";
import { CheckIcon } from "@/components/ui/check";
import { useInstalledSkills } from "@/lib/installed-skills-context";
import { useToast } from "@/components/toast";

export function HomeSkillEquip({ skillId, skillName, installs }: { skillId: string; skillName: string; installs: number }) {
  const { isInstalled, install, uninstall } = useInstalledSkills();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "installing">("idle");
  const installed = isInstalled(skillId);

  function handleInstall() {
    setState("installing");
    setTimeout(() => {
      install(skillId);
      toast(`${skillName} added to your agent`);
      setState("idle");
    }, 800);
  }

  if (installed) {
    return (
      <div className="flex items-center justify-between pt-1">
        <span className="type-caption text-muted-foreground font-mono">
          {installs.toLocaleString()} installs
        </span>
        <AnimatedButton
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs group"
          onClick={() => uninstall(skillId)}
        >
          <CheckIcon size={12} />
          <span className="group-hover:hidden">Installed</span>
          <span className="hidden group-hover:inline text-[#FF00F0]">Remove</span>
        </AnimatedButton>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-1">
      <span className="type-caption text-muted-foreground font-mono">
        {installs.toLocaleString()} installs
      </span>
      <AnimatedButton
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        disabled={state === "installing"}
        onClick={state === "idle" ? handleInstall : undefined}
      >
        {state === "installing" ? (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
        ) : (
          <PlusIcon size={12} />
        )}
        <TextMorph>{state === "installing" ? "Installing..." : "Install"}</TextMorph>
      </AnimatedButton>
    </div>
  );
}
