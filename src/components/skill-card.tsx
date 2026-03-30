"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Skill } from "@/lib/skills";

interface SkillCardProps {
  href: string;
  skill: Skill;
}

export function SkillCard({ skill, href }: SkillCardProps) {
  return (
    <div className="relative">
      <Link href={href} className="peer/link absolute inset-0 z-0" aria-label={skill.name} />
      <Card className="h-full transition-[background-color,color,border-color] duration-150 peer-hover/link:border-foreground peer-hover/link:bg-foreground peer-hover/link:text-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{skill.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-3">
          <p className="text-sm text-muted-foreground peer-hover/link:text-background/70">
            {skill.description}
          </p>
          <div className="relative z-10 flex items-center justify-end pt-1">
            <span className="type-label text-muted-foreground transition-colors peer-hover/link:text-background/70">
              View skill
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
