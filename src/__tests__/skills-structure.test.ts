import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "yaml";

const ROOT = path.resolve(__dirname, "../..");
const SKILL_DIRS = [
  "trend-scout",
  "creator-pulse",
  "briefing-bot",
  "portfolio-scout",
  "momentum-trader",
];

const REQUIRED_SECTIONS = [
  "## When to Use This Skill",
  "## Setup",
  "## Configuration",
  "## Commands",
  "## How It Works",
  "## Example Output",
  "## Troubleshooting",
  "## Important Notes",
];

function readSkillMd(skill: string) {
  const filePath = path.join(ROOT, skill, "SKILL.md");
  return fs.readFileSync(filePath, "utf-8");
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("No frontmatter found");
  return yaml.parse(match[1]);
}

function getBody(content: string) {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

describe.each(SKILL_DIRS)("%s/SKILL.md", (skill) => {
  const content = readSkillMd(skill);
  const frontmatter = parseFrontmatter(content);
  const body = getBody(content);

  describe("frontmatter", () => {
    it("has required name field matching directory", () => {
      expect(frontmatter.name).toBe(skill);
    });

    it("name matches slug pattern", () => {
      expect(frontmatter.name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    });

    it("has non-empty description under 1024 chars", () => {
      expect(frontmatter.description).toBeTruthy();
      expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
    });

    it("has metadata.author", () => {
      expect(frontmatter.metadata?.author).toBeTruthy();
    });

    it("has metadata.version matching semver", () => {
      expect(frontmatter.metadata?.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("has metadata.displayName", () => {
      expect(frontmatter.metadata?.displayName).toBeTruthy();
    });

    it("has valid metadata.difficulty", () => {
      expect(["beginner", "intermediate", "advanced"]).toContain(
        frontmatter.metadata?.difficulty
      );
    });

    it("does not contain requires, tunables, or openclaw in frontmatter", () => {
      expect(frontmatter.requires).toBeUndefined();
      expect(frontmatter.tunables).toBeUndefined();
      expect(frontmatter.metadata?.openclaw).toBeUndefined();
    });
  });

  describe("body sections", () => {
    it("has an h1 heading", () => {
      expect(body).toMatch(/^# .+/m);
    });

    it.each(REQUIRED_SECTIONS)("contains %s", (section) => {
      expect(body).toContain(section);
    });

    it("word count is between 300 and 800", () => {
      const count = wordCount(body);
      expect(count).toBeGreaterThanOrEqual(300);
      expect(count).toBeLessThanOrEqual(800);
    });
  });

  describe("CLI flag correctness", () => {
    const codeBlocks = body.match(/```[\s\S]*?```/g) ?? [];
    const codeContent = codeBlocks.join("\n");

    it("explore commands use --json (global flag)", () => {
      const exploreLines = codeContent
        .split("\n")
        .filter((l) => l.includes("zora explore"));
      for (const line of exploreLines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("get commands use --json (global flag)", () => {
      const getLines = codeContent
        .split("\n")
        .filter((l) => l.includes("zora get"));
      for (const line of getLines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("balance commands use --json (global flag)", () => {
      const balLines = codeContent
        .split("\n")
        .filter((l) => l.includes("zora balance"));
      for (const line of balLines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("buy commands use -o json (local flag)", () => {
      const buyLines = codeContent
        .split("\n")
        .filter((l) => l.includes("zora buy"));
      for (const line of buyLines) {
        expect(line).toMatch(/-o\s+json/);
      }
    });

    it("sell commands use -o json (local flag)", () => {
      const sellLines = codeContent
        .split("\n")
        .filter((l) => l.includes("zora sell"));
      for (const line of sellLines) {
        expect(line).toMatch(/-o\s+json/);
      }
    });
  });
});

describe.each(SKILL_DIRS)("%s/clawhub.json", (skill) => {
  const filePath = path.join(ROOT, skill, "clawhub.json");
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  it("has required fields", () => {
    expect(content).toHaveProperty("emoji");
    expect(content).toHaveProperty("requires");
    expect(content).toHaveProperty("cron");
    expect(content).toHaveProperty("autostart");
  });

  it("emoji is a non-empty string", () => {
    expect(typeof content.emoji).toBe("string");
    expect(content.emoji.length).toBeGreaterThan(0);
  });

  it("requires.bins contains zora", () => {
    expect(content.requires.bins).toContain("zora");
  });

  it("autostart is false", () => {
    expect(content.autostart).toBe(false);
  });

  it("automaton block declares CLI wrapper (managed: false)", () => {
    expect(content.automaton).toEqual({ managed: false, entrypoint: null });
  });
});

describe("momentum-trader/clawhub.json execution skill specifics", () => {
  const content = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "momentum-trader", "clawhub.json"),
      "utf-8"
    )
  );

  it("requires ZORA_API_KEY", () => {
    expect(content.requires.env).toContain("ZORA_API_KEY");
  });

  it("requires ZORA_PRIVATE_KEY", () => {
    expect(content.requires.env).toContain("ZORA_PRIVATE_KEY");
  });

  it("has tunables array", () => {
    expect(Array.isArray(content.tunables)).toBe(true);
    expect(content.tunables.length).toBeGreaterThan(0);
  });

  it.each(
    JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "momentum-trader", "clawhub.json"),
        "utf-8"
      )
    ).tunables
  )("tunable $env has valid structure", (tunable: Record<string, unknown>) => {
    expect(tunable).toHaveProperty("env");
    expect(tunable).toHaveProperty("type");
    expect(tunable).toHaveProperty("default");
    expect(tunable).toHaveProperty("range");
    expect(tunable).toHaveProperty("step");
    expect(tunable).toHaveProperty("label");

    expect(typeof tunable.env).toBe("string");
    expect((tunable.env as string).startsWith("ZORA_MOMENTUM_")).toBe(true);

    const range = tunable.range as number[];
    expect(range).toHaveLength(2);
    expect(tunable.default).toBeGreaterThanOrEqual(range[0]);
    expect(tunable.default).toBeLessThanOrEqual(range[1]);
  });
});

describe("read-only skills clawhub.json", () => {
  const readOnlySkills = [
    "trend-scout",
    "creator-pulse",
    "briefing-bot",
    "portfolio-scout",
  ];

  it.each(readOnlySkills)("%s has no requires.env", (skill) => {
    const content = JSON.parse(
      fs.readFileSync(path.join(ROOT, skill, "clawhub.json"), "utf-8")
    );
    expect(content.requires.env).toBeUndefined();
  });
});

describe.each(SKILL_DIRS)("%s/scripts/validate.sh", (skill) => {
  const filePath = path.join(ROOT, skill, "scripts", "validate.sh");

  it("exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("is executable", () => {
    const stat = fs.statSync(filePath);
    // Check owner execute bit
    expect(stat.mode & 0o100).toBeTruthy();
  });

  it("has bash shebang", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content.startsWith("#!/usr/bin/env bash")).toBe(true);
  });
});
