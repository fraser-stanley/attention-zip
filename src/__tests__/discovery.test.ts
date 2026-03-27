import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as getApiRoute } from "@/app/api/route";
import { GET as getSkillsRoute } from "@/app/api/skills/route";
import {
  buildAiDiscovery,
  buildLlmsFullTxt,
  buildLlmsTxt,
} from "@/lib/discovery";
import { skills } from "@/lib/skills";

const TEST_BASE_URL = "https://example.com";

describe("buildAiDiscovery", () => {
  it("includes llms and agent lifecycle endpoints", () => {
    expect(buildAiDiscovery(TEST_BASE_URL)).toMatchObject({
      llms_txt: "/llms.txt",
      llms_full_txt: "/llms-full.txt",
      agent_registration_url: "/api/agents/register",
      agent_me_url: "/api/agents/me",
      agent_claim_url: "/api/agents/claim",
    });
  });
});

describe("buildLlmsTxt", () => {
  it("includes the catalog link, default install command, and skill URLs", () => {
    const llmsTxt = buildLlmsTxt(TEST_BASE_URL);

    expect(llmsTxt).toContain("Catalog: https://example.com/api/skills");
    expect(llmsTxt).toContain(
      'Default install (Claude Code): claude -p "Install skills from https://example.com/llms.txt"',
    );

    for (const skill of skills) {
      expect(llmsTxt).toContain(skill.name);
      expect(llmsTxt).toContain(
        `https://example.com/skills/${skill.id}/skill-md`,
      );
    }
  });
});

describe("buildLlmsFullTxt", () => {
  it("includes install commands, skill command lists, CLI reference, and live registration docs", () => {
    const llmsFullTxt = buildLlmsFullTxt(TEST_BASE_URL);

    expect(llmsFullTxt).toContain("## Install All Skills");
    expect(llmsFullTxt).toContain("## Zora CLI Reference");
    expect(llmsFullTxt).toContain("zora explore --sort <sort>");
    expect(llmsFullTxt).toContain("POST https://example.com/api/agents/register");
    expect(llmsFullTxt).toContain("GET https://example.com/api/agents/me");
    expect(llmsFullTxt).toContain("POST https://example.com/api/agents/claim");
    expect(llmsFullTxt).toContain("https://example.com/claim/{claim_code}");
    expect(llmsFullTxt).toContain("## Trend Scout");
    expect(llmsFullTxt).toContain(
      "zora explore --sort trending --type trend --limit 8 --json",
    );
    expect(llmsFullTxt).toContain("Sample output");
    expect(llmsFullTxt).toContain("Trend Scout");
  });
});

describe("/api", () => {
  it("includes all three agent lifecycle endpoints", async () => {
    const response = await getApiRoute(
      new NextRequest("https://example.com/api"),
    );
    const data = await response.json();

    expect(data.agentRegistrationUrl).toBe("/api/agents/register");
    expect(data.agentMeUrl).toBe("/api/agents/me");
    expect(data.agentClaimUrl).toBe("/api/agents/claim");
    expect(data.endpoints.agentsRegister.url).toBe("/api/agents/register");
    expect(data.endpoints.agentsMe.url).toBe("/api/agents/me");
    expect(data.endpoints.agentsClaim.url).toBe("/api/agents/claim");
  });
});

describe("/api/skills", () => {
  it("serializes quickInstall commands for a single skill", async () => {
    const response = await getSkillsRoute(
      new NextRequest("https://example.com/api/skills?id=trend-scout"),
    );
    const data = await response.json();

    expect(data.skill.quickInstall.claude).toBe(
      'claude -p "Install Trend Scout from https://example.com/skills/trend-scout/skill-md"',
    );
    expect(data.skill.install.manual).toContain("git clone --depth 1");
  });

  it("serializes quickInstall commands in the catalog response", async () => {
    const response = await getSkillsRoute(
      new NextRequest("https://example.com/api/skills"),
    );
    const data = await response.json();

    expect(data.skills).toHaveLength(skills.length);
    expect(data.skills[0].quickInstall.openclaw).toMatch(/^clawhub install /);
  });
});
