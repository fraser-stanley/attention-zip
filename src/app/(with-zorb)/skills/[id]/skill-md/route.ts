import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { skills } from "@/lib/skills";

const VALID_IDS = new Set(skills.map((s) => s.id));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!VALID_IDS.has(id)) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const filePath = join(process.cwd(), "skills", id, "SKILL.md");

  try {
    const content = readFileSync(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "SKILL.md not found" }, { status: 404 });
  }
}
