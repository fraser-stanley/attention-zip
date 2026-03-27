import { NextRequest, NextResponse } from "next/server";
import {
  getSkillById,
  getSkillRuntimeCommands,
  skills,
  type Skill,
} from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

function serializeSkill(skill: Skill, baseUrl: string) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    longDescription: skill.longDescription,
    category: skill.category,
    difficulty: skill.difficulty,
    risk: skill.risk,
    riskLabel: skill.riskLabel,
    tags: skill.tags,
    requires: skill.requires,
    automation: skill.automation,
    install: getSkillRuntimeCommands(skill, baseUrl),
    monitors: skill.monitors,
    commands: skill.commands,
    actionPrompt: skill.actionPrompt,
    samplePrompt: skill.samplePrompt,
    sampleOutput: skill.sampleOutput,
    badges: skill.badges,
    githubUrl: skill.githubUrl,
    skillMdUrl: `${baseUrl}/skills/${skill.id}/skill-md`,
  };
}

export async function GET(request: NextRequest) {
  const baseUrl = getSiteUrl(request.url);
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const skill = getSkillById(id);

    if (!skill) {
      return NextResponse.json(
        { error: `Skill not found: ${id}` },
        {
          status: 404,
          headers: {
            "Cache-Control": CACHE_CONTROL,
          },
        },
      );
    }

    return NextResponse.json(
      {
        skill: {
          ...serializeSkill(skill, baseUrl),
        },
      },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  return NextResponse.json(
    {
      skills: skills.map((skill) => ({
        ...serializeSkill(skill, baseUrl),
      })),
    },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    },
  );
}
