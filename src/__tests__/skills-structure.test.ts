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

type Tunable = {
  env: string;
  type: "number" | "string" | "boolean";
  default: unknown;
  label: string;
  range?: number[];
  step?: number;
};

function readSkillMd(skill: string) {
  return fs.readFileSync(path.join(ROOT, skill, "SKILL.md"), "utf8");
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
        frontmatter.metadata?.difficulty,
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

    it("explore commands use --json", () => {
      const lines = codeContent
        .split("\n")
        .filter((line) => line.includes("zora explore"));
      for (const line of lines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("get commands use --json", () => {
      const lines = codeContent
        .split("\n")
        .filter((line) => line.includes("zora get"));
      for (const line of lines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("balance commands use --json", () => {
      const lines = codeContent
        .split("\n")
        .filter((line) => line.includes("zora balance"));
      for (const line of lines) {
        expect(line).toContain("--json");
        expect(line).not.toMatch(/-o\s+json/);
      }
    });

    it("buy commands use -o json", () => {
      const lines = codeContent
        .split("\n")
        .filter((line) => line.includes("zora buy"));
      for (const line of lines) {
        expect(line).toMatch(/-o\s+json/);
      }
    });

    it("sell commands use -o json", () => {
      const lines = codeContent
        .split("\n")
        .filter((line) => line.includes("zora sell"));
      for (const line of lines) {
        expect(line).toMatch(/-o\s+json/);
      }
    });
  });
});

describe.each(SKILL_DIRS)("%s/clawhub.json", (skill) => {
  const filePath = path.join(ROOT, skill, "clawhub.json");
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

  it("has required fields", () => {
    expect(content).toHaveProperty("emoji");
    expect(content).toHaveProperty("requires");
    expect(content).toHaveProperty("cron");
    expect(content).toHaveProperty("autostart");
    expect(content).toHaveProperty("automaton");
    expect(content).toHaveProperty("tunables");
  });

  it("emoji is a non-empty string", () => {
    expect(typeof content.emoji).toBe("string");
    expect(content.emoji.length).toBeGreaterThan(0);
  });

  it("requires.bins contains zora and node", () => {
    expect(content.requires.bins).toContain("zora");
    expect(content.requires.bins).toContain("node");
  });

  it("autostart is false", () => {
    expect(content.autostart).toBe(false);
  });

  it("automaton is managed and points at scripts/run.mjs", () => {
    expect(content.automaton).toEqual({
      managed: true,
      entrypoint: "scripts/run.mjs",
    });
  });

  it("cron is a non-empty string", () => {
    expect(typeof content.cron).toBe("string");
    expect(content.cron.length).toBeGreaterThan(0);
  });

  it("has at least one tunable", () => {
    expect(Array.isArray(content.tunables)).toBe(true);
    expect(content.tunables.length).toBeGreaterThan(0);
  });

  it.each(content.tunables as Tunable[])(
    "tunable $env has valid structure",
    (tunable) => {
      expect(tunable).toHaveProperty("env");
      expect(tunable).toHaveProperty("type");
      expect(tunable).toHaveProperty("default");
      expect(tunable).toHaveProperty("label");

      expect(typeof tunable.env).toBe("string");
      expect(typeof tunable.label).toBe("string");
      expect(["number", "string", "boolean"]).toContain(tunable.type);

      if (tunable.type === "number") {
        expect(tunable).toHaveProperty("range");
        expect(tunable).toHaveProperty("step");
        const range = tunable.range as number[];
        expect(range).toHaveLength(2);
        expect(tunable.default).toBeGreaterThanOrEqual(range[0]);
        expect(tunable.default).toBeLessThanOrEqual(range[1]);
      }
    },
  );
});

describe("env requirements", () => {
  it("trend-scout has no required env vars", () => {
    const content = JSON.parse(
      fs.readFileSync(path.join(ROOT, "trend-scout", "clawhub.json"), "utf8"),
    );
    expect(content.requires.env).toBeUndefined();
  });

  it("creator-pulse has no required env vars", () => {
    const content = JSON.parse(
      fs.readFileSync(path.join(ROOT, "creator-pulse", "clawhub.json"), "utf8"),
    );
    expect(content.requires.env).toBeUndefined();
  });

  it("briefing-bot has no required env vars", () => {
    const content = JSON.parse(
      fs.readFileSync(path.join(ROOT, "briefing-bot", "clawhub.json"), "utf8"),
    );
    expect(content.requires.env).toBeUndefined();
  });

  it("portfolio-scout requires ZORA_PRIVATE_KEY", () => {
    const content = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "portfolio-scout", "clawhub.json"),
        "utf8",
      ),
    );
    expect(content.requires.env).toContain("ZORA_PRIVATE_KEY");
  });

  it("momentum-trader requires ZORA_PRIVATE_KEY", () => {
    const content = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "momentum-trader", "clawhub.json"),
        "utf8",
      ),
    );
    expect(content.requires.env).toContain("ZORA_PRIVATE_KEY");
  });
});

describe.each(SKILL_DIRS)("%s/scripts assets", (skill) => {
  const validatePath = path.join(ROOT, skill, "scripts", "validate.sh");
  const entrypointPath = path.join(ROOT, skill, "scripts", "run.mjs");

  it("validate.sh exists", () => {
    expect(fs.existsSync(validatePath)).toBe(true);
  });

  it("run.mjs exists", () => {
    expect(fs.existsSync(entrypointPath)).toBe(true);
  });

  it("validate.sh is executable", () => {
    const stat = fs.statSync(validatePath);
    expect(stat.mode & 0o100).toBeTruthy();
  });

  it("run.mjs is executable", () => {
    const stat = fs.statSync(entrypointPath);
    expect(stat.mode & 0o100).toBeTruthy();
  });
});
