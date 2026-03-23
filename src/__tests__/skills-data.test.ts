import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { skills, getSkillById, getSkillRuntimeCommands } from "@/lib/skills";

const ROOT = path.resolve(__dirname, "../..");

describe("skills array", () => {
  it("has exactly 5 skills", () => {
    expect(skills).toHaveLength(5);
  });

  it("has no duplicate IDs", () => {
    const ids = skills.map((skill) => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(skills.map((skill) => [skill.id, skill]))(
    "%s has the expected metadata",
    (_id, skill) => {
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.longDescription).toBeTruthy();
      expect(["attention", "analytics", "trading", "utility"]).toContain(
        skill.category,
      );
      expect(["beginner", "intermediate", "advanced"]).toContain(
        skill.difficulty,
      );
      expect(["none", "low", "medium"]).toContain(skill.risk);
      expect(skill.riskLabel).toBeTruthy();
      expect(skill.tags.length).toBeGreaterThan(0);
      expect(skill.monitors.length).toBeGreaterThan(0);
      expect(skill.commands.length).toBeGreaterThan(0);
      expect(skill.requires.bins.length).toBeGreaterThan(0);
      expect(typeof skill.automation.managed).toBe("boolean");
      expect(skill.automation.entrypoint).toBeTruthy();
      expect(skill.samplePrompt).toBeTruthy();
      expect(skill.sampleOutput).toBeTruthy();
      expect(skill.badges.length).toBeGreaterThan(0);
      expect(skill.githubUrl).toContain(skill.id);
      expect(skill.skillMdUrl).toContain(skill.id);
    },
  );
});

describe("cross-file sync", () => {
  it.each(skills.map((skill) => skill.id))(
    "%s has a matching skill directory",
    (id) => {
      expect(fs.existsSync(path.join(ROOT, id))).toBe(true);
      expect(fs.existsSync(path.join(ROOT, id, "SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(ROOT, id, "clawhub.json"))).toBe(true);
    },
  );

  it.each(skills.map((skill) => skill.id))(
    "%s SKILL.md name matches skills.ts id",
    (id) => {
      const content = fs.readFileSync(path.join(ROOT, id, "SKILL.md"), "utf8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      expect(match).toBeTruthy();
      const frontmatter = yaml.parse(match![1]);
      expect(frontmatter.name).toBe(id);
    },
  );
});

describe("CLI flag correctness in commands", () => {
  for (const skill of skills) {
    describe(skill.id, () => {
      const exploreCommands = skill.commands.filter((command) =>
        command.includes("zora explore"),
      );
      const getCommands = skill.commands.filter((command) =>
        command.includes("zora get"),
      );
      const balanceCommands = skill.commands.filter((command) =>
        command.includes("zora balance"),
      );
      const buyCommands = skill.commands.filter((command) =>
        command.includes("zora buy"),
      );
      const sellCommands = skill.commands.filter((command) =>
        command.includes("zora sell"),
      );

      if (exploreCommands.length > 0) {
        it.each(exploreCommands)(
          "explore command %s uses --json",
          (command) => {
            expect(command).toContain("--json");
            expect(command).not.toMatch(/-o\s+json/);
          },
        );
      }

      if (getCommands.length > 0) {
        it.each(getCommands)("get command %s uses --json", (command) => {
          expect(command).toContain("--json");
          expect(command).not.toMatch(/-o\s+json/);
        });
      }

      if (balanceCommands.length > 0) {
        it.each(balanceCommands)(
          "balance command %s uses --json",
          (command) => {
            expect(command).toContain("--json");
            expect(command).not.toMatch(/-o\s+json/);
          },
        );
      }

      if (buyCommands.length > 0) {
        it.each(buyCommands)("buy command %s uses -o json", (command) => {
          expect(command).toMatch(/-o\s+json/);
        });
      }

      if (sellCommands.length > 0) {
        it.each(sellCommands)("sell command %s uses -o json", (command) => {
          expect(command).toMatch(/-o\s+json/);
        });
      }
    });
  }
});

describe("execution skill safety", () => {
  const momentum = skills.find((skill) => skill.id === "momentum-trader")!;
  const readOnly = skills.filter((skill) => skill.risk === "none");

  it("momentum-trader has risk: medium", () => {
    expect(momentum.risk).toBe("medium");
  });

  it("momentum-trader is dry-run by default", () => {
    expect(momentum.automation.dryRunByDefault).toBe(true);
  });

  it("momentum-trader commands include buy and sell", () => {
    expect(
      momentum.commands.some((command) => command.includes("zora buy")),
    ).toBe(true);
    expect(
      momentum.commands.some((command) => command.includes("zora sell")),
    ).toBe(true);
  });

  it.each(readOnly.map((skill) => [skill.id, skill]))(
    "read-only skill %s has no buy/sell commands",
    (_id, skill) => {
      for (const command of skill.commands) {
        expect(command).not.toContain("zora buy");
        expect(command).not.toContain("zora sell");
      }
    },
  );
});

describe("getSkillById", () => {
  it("returns the matching skill for a valid id", () => {
    const skill = getSkillById("trend-scout");
    expect(skill).not.toBeNull();
    expect(skill?.name).toBe("Trend Scout");
  });

  it("returns null for an unknown id", () => {
    expect(getSkillById("missing")).toBeNull();
  });
});

const TEST_BASE_URL = "https://example.com";

describe("getSkillRuntimeCommands", () => {
  it("returns all runtime keys and a manual command", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands).toHaveProperty("openclaw");
    expect(commands).toHaveProperty("claude");
    expect(commands).toHaveProperty("amp");
    expect(commands).toHaveProperty("codex");
    expect(commands).toHaveProperty("opencode");
    expect(commands).toHaveProperty("cursor");
    expect(commands).toHaveProperty("manual");
  });

  it("commands contain the skill id", () => {
    for (const skill of skills) {
      const commands = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      expect(commands.openclaw).toContain(skill.id);
      expect(commands.claude).toContain(skill.id);
      expect(commands.manual).toContain(skill.id);
    }
  });

  it("non-openclaw commands contain the site URL", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.claude).toContain(TEST_BASE_URL);
  });

  it("openclaw uses clawhub install", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.openclaw).toMatch(/^clawhub install /);
  });

  it("manual command clones the source repo", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.manual).toContain("git clone --depth 1");
    expect(commands.manual).toContain("zora-agent-skills");
  });

  it("commands include the action prompt", () => {
    for (const skill of skills) {
      const commands = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      expect(commands.claude).toContain(skill.actionPrompt);
    }
  });
});

describe("actionPrompt", () => {
  it.each(skills.map((skill) => [skill.id, skill]))(
    "%s has a non-empty actionPrompt",
    (_id, skill) => {
      expect(skill.actionPrompt).toBeTruthy();
      expect(skill.actionPrompt.length).toBeGreaterThan(5);
    },
  );
});
