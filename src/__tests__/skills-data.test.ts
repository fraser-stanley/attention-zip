import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {
  skills,
  getSkillById,
  getSkillRuntimeCommands,
} from "@/lib/skills";

const ROOT = path.resolve(__dirname, "../..");

// --- skills.ts array integrity ---

describe("skills array", () => {
  it("has exactly 5 skills", () => {
    expect(skills).toHaveLength(5);
  });

  it("has no duplicate IDs", () => {
    const ids = skills.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(skills.map((s) => [s.id, s]))(
    "%s has all required fields populated",
    (_id, skill) => {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.longDescription).toBeTruthy();
      expect(["none", "low", "medium"]).toContain(skill.risk);
      expect(skill.riskLabel).toBeTruthy();
      expect(skill.monitors.length).toBeGreaterThan(0);
      expect(skill.wraps.length).toBeGreaterThan(0);
      expect(skill.samplePrompt).toBeTruthy();
      expect(skill.sampleOutput).toBeTruthy();
      expect(skill.badges.length).toBeGreaterThan(0);
      expect(skill.githubUrl).toContain(skill.id);
      expect(skill.skillMdUrl).toContain(skill.id);
    }
  );
});

// --- Cross-file sync ---

describe("cross-file sync", () => {
  it.each(skills.map((s) => s.id))(
    "%s has a matching skill directory",
    (id) => {
      const dirPath = path.join(ROOT, id);
      expect(fs.existsSync(dirPath)).toBe(true);
    }
  );

  it.each(skills.map((s) => s.id))(
    "%s directory has SKILL.md and clawhub.json",
    (id) => {
      expect(fs.existsSync(path.join(ROOT, id, "SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(ROOT, id, "clawhub.json"))).toBe(true);
    }
  );

  it.each(skills.map((s) => s.id))(
    "%s SKILL.md name matches skills.ts id",
    (id) => {
      const content = fs.readFileSync(
        path.join(ROOT, id, "SKILL.md"),
        "utf-8"
      );
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      expect(match).toBeTruthy();
      const frontmatter = yaml.parse(match![1]);
      expect(frontmatter.name).toBe(id);
    }
  );
});

// --- CLI flag correctness in wraps ---

describe("wraps CLI flag correctness", () => {
  for (const skill of skills) {
    describe(skill.id, () => {
      const exploreWraps = skill.wraps.filter((w) =>
        w.includes("zora explore")
      );
      const getWraps = skill.wraps.filter((w) => w.includes("zora get"));
      const balancesWraps = skill.wraps.filter((w) =>
        w.includes("zora balance")
      );
      const buyWraps = skill.wraps.filter((w) => w.includes("zora buy"));
      const sellWraps = skill.wraps.filter((w) => w.includes("zora sell"));

      if (exploreWraps.length > 0) {
        it.each(exploreWraps)(
          'explore wrap "%s" uses --json',
          (wrap) => {
            expect(wrap).toContain("--json");
            expect(wrap).not.toMatch(/-o\s+json/);
          }
        );
      }

      if (getWraps.length > 0) {
        it.each(getWraps)(
          'get wrap "%s" uses --json',
          (wrap) => {
            expect(wrap).toContain("--json");
            expect(wrap).not.toMatch(/-o\s+json/);
          }
        );
      }

      if (balancesWraps.length > 0) {
        it.each(balancesWraps)(
          'balances wrap "%s" uses --json',
          (wrap) => {
            expect(wrap).toContain("--json");
            expect(wrap).not.toMatch(/-o\s+json/);
          }
        );
      }

      if (buyWraps.length > 0) {
        it.each(buyWraps)(
          'buy wrap "%s" uses -o json',
          (wrap) => {
            expect(wrap).toMatch(/-o\s+json/);
          }
        );
      }

      if (sellWraps.length > 0) {
        it.each(sellWraps)(
          'sell wrap "%s" uses -o json',
          (wrap) => {
            expect(wrap).toMatch(/-o\s+json/);
          }
        );
      }
    });
  }
});

// --- Execution skill safety ---

describe("execution skill safety", () => {
  const momentum = skills.find((s) => s.id === "momentum-trader")!;
  const readOnly = skills.filter((s) => s.risk === "none");

  it("momentum-trader has risk: medium", () => {
    expect(momentum.risk).toBe("medium");
  });

  it("momentum-trader riskLabel mentions wallet or execution", () => {
    const label = momentum.riskLabel.toLowerCase();
    expect(label.includes("wallet") || label.includes("execution")).toBe(true);
  });

  it("momentum-trader wraps include buy and sell", () => {
    expect(momentum.wraps.some((w) => w.includes("zora buy"))).toBe(true);
    expect(momentum.wraps.some((w) => w.includes("zora sell"))).toBe(true);
  });

  it.each(readOnly.map((s) => [s.id, s]))(
    "read-only skill %s has no buy/sell in wraps",
    (_id, skill) => {
      for (const wrap of skill.wraps) {
        expect(wrap).not.toContain("zora buy");
        expect(wrap).not.toContain("zora sell");
      }
    }
  );
});

// --- getSkillById ---

describe("getSkillById", () => {
  it("returns correct skill for valid id", () => {
    const skill = getSkillById("trend-scout");
    expect(skill).not.toBeNull();
    expect(skill!.name).toBe("Trend Scout");
  });

  it("returns null for nonexistent id", () => {
    expect(getSkillById("nonexistent")).toBeNull();
  });
});

// --- getSkillRuntimeCommands ---

const TEST_BASE_URL = "https://example.com";

describe("getSkillRuntimeCommands", () => {
  it("returns all runtime keys and curl", () => {
    const cmds = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(cmds).toHaveProperty("openclaw");
    expect(cmds).toHaveProperty("claude");
    expect(cmds).toHaveProperty("amp");
    expect(cmds).toHaveProperty("codex");
    expect(cmds).toHaveProperty("opencode");
    expect(cmds).toHaveProperty("cursor");
    expect(cmds).toHaveProperty("curl");
  });

  it("commands contain the skill id", () => {
    for (const skill of skills) {
      const cmds = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      expect(cmds.openclaw).toContain(skill.id);
      expect(cmds.claude).toContain(skill.id);
      expect(cmds.amp).toContain(skill.id);
      expect(cmds.codex).toContain(skill.id);
      expect(cmds.opencode).toContain(skill.id);
      expect(cmds.cursor).toContain(skill.id);
      expect(cmds.curl).toContain(skill.id);
    }
  });

  it("commands contain the base URL", () => {
    const cmds = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(cmds.claude).toContain(TEST_BASE_URL);
    expect(cmds.curl).toContain(TEST_BASE_URL);
  });

  it("openclaw uses clawhub install", () => {
    const cmds = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(cmds.openclaw).toMatch(/^clawhub install /);
  });

  it("commands include the action prompt", () => {
    for (const skill of skills) {
      const cmds = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      expect(cmds.claude).toContain(skill.actionPrompt);
    }
  });
});

// --- actionPrompt ---

describe("actionPrompt", () => {
  it.each(skills.map((s) => [s.id, s]))(
    "%s has a non-empty actionPrompt",
    (_id, skill) => {
      expect(skill.actionPrompt).toBeTruthy();
      expect(skill.actionPrompt.length).toBeGreaterThan(5);
    }
  );
});
