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
  it("includes llms and market-data endpoints", () => {
    const discovery = buildAiDiscovery(TEST_BASE_URL);
    expect(discovery).toMatchObject({
      llms_txt: "/llms.txt",
      llms_full_txt: "/llms-full.txt",
      profile_endpoint: "/api/profile",
      coin_swaps_endpoint: "/api/coin-swaps",
    });
    expect(discovery).not.toHaveProperty("agent_registration_url");
    expect(discovery).not.toHaveProperty("agent_me_url");
    expect(discovery).not.toHaveProperty("agent_claim_url");
  });
});

describe("buildLlmsTxt", () => {
  it("includes Quick Start steps, skill URLs, and reference links", () => {
    const llmsTxt = buildLlmsTxt(TEST_BASE_URL);

    expect(llmsTxt).toContain("## Quick Start");
    expect(llmsTxt).toContain("Step 1 — Install the Zora CLI");
    expect(llmsTxt).toContain("npm install -g @zoralabs/cli");
    expect(llmsTxt).toContain("Step 2 — Install skills");
    expect(llmsTxt).toContain("git clone --depth 1");
    expect(llmsTxt).toContain("~/.config/zora-agent-skills");
    expect(llmsTxt).toContain("GET https://example.com/api/skills");
    expect(llmsTxt).toContain("install.sh");
    expect(llmsTxt).toContain("Step 3 — Verify the CLI works");
    expect(llmsTxt).toContain("zora explore --sort trending --limit 3 --json");
    expect(llmsTxt).toContain("Step 4 — Optional wallet setup");
    expect(llmsTxt).toContain("zora setup --create");
    expect(llmsTxt).toContain("Step 5 — Try a skill");
    expect(llmsTxt).toContain("## Skills");
    expect(llmsTxt).toContain("## Reference");
    expect(llmsTxt).toContain("Skill catalog API: https://example.com/api/skills");
    expect(llmsTxt).toContain("Profile API: https://example.com/api/profile");
    expect(llmsTxt).toContain("Coin swaps API: https://example.com/api/coin-swaps");

    for (const skill of skills) {
      expect(llmsTxt).toContain(skill.name);
      expect(llmsTxt).toContain(
        `https://example.com/skills/${skill.id}/skill-md`,
      );
    }
  });
});

describe("buildLlmsFullTxt", () => {
  it("includes install commands, skill command lists, market APIs, and CLI reference", () => {
    const llmsFullTxt = buildLlmsFullTxt(TEST_BASE_URL);

    expect(llmsFullTxt).toContain("## How To Explain This");
    expect(llmsFullTxt).toContain("## Install Guidance");
    expect(llmsFullTxt).toContain("Skills use the Zora CLI for market data and balance checks. Trading skills also place orders through it.");
    expect(llmsFullTxt).toContain("Portfolio Scout, Copy Trader, and Momentum Trader need a wallet.");
    expect(llmsFullTxt).toContain("## Install All Skills");
    expect(llmsFullTxt).toContain("## Market Data APIs");
    expect(llmsFullTxt).toContain("GET https://example.com/api/profile");
    expect(llmsFullTxt).toContain("GET https://example.com/api/coin-swaps");
    expect(llmsFullTxt).toContain("## Zora CLI Reference");
    expect(llmsFullTxt).toContain("zora explore --sort <sort>");
    expect(llmsFullTxt).not.toContain("## Agent Registration");
    expect(llmsFullTxt).not.toContain("/api/agents/register");
    expect(llmsFullTxt).toContain("## Trend Scout");
    expect(llmsFullTxt).toContain(
      "zora explore --sort trending --type trend --limit 8 --json",
    );
    expect(llmsFullTxt).toContain("Sample output");
    expect(llmsFullTxt).toContain("Trend Scout");
  });
});

describe("/api", () => {
  it("includes market-data endpoints without agent registration", async () => {
    const response = await getApiRoute(
      new NextRequest("https://example.com/api"),
    );
    const data = await response.json();

    expect(data.endpoints.profile.url).toBe("/api/profile");
    expect(data.endpoints.coinSwaps.url).toBe("/api/coin-swaps");
    expect(data).not.toHaveProperty("agentRegistrationUrl");
    expect(data.endpoints).not.toHaveProperty("agentsRegister");
    expect(data.endpoints).not.toHaveProperty("agentsMe");
    expect(data.endpoints).not.toHaveProperty("agentsClaim");
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
