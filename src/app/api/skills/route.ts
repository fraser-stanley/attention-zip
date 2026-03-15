import { NextRequest, NextResponse } from "next/server";
import {
  getSkillById,
  getSkillInstallCommands,
  skills,
  type Skill,
} from "@/lib/skills";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

function serializeSkill(skill: Skill) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    longDescription: skill.longDescription,
    risk: skill.risk,
    riskLabel: skill.riskLabel,
    install: getSkillInstallCommands(skill),
    monitors: skill.monitors,
    wraps: skill.wraps,
    samplePrompt: skill.samplePrompt,
    sampleOutput: skill.sampleOutput,
    badges: skill.badges,
    githubUrl: skill.githubUrl,
    skillMdUrl: skill.skillMdUrl,
  };
}

export async function GET(request: NextRequest) {
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
        }
      );
    }

    return NextResponse.json(
      { skill: serializeSkill(skill) },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      }
    );
  }

  return NextResponse.json(
    { skills: skills.map(serializeSkill) },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    }
  );
}
