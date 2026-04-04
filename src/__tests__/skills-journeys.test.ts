import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { skills } from "@/lib/skills";
import {
  getSkillRuntimeCommands,
  getSkillQuickInstallCommands,
  getInstallAllCommands,
} from "@/lib/skills";

const ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(ROOT, "skills");
const TEST_BASE_URL = "https://example.com";

function readSkillMd(skill: string) {
  return fs.readFileSync(path.join(SKILLS_DIR, skill, "SKILL.md"), "utf8");
}

function getBody(content: string) {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

function getSection(body: string, heading: string): string {
  const sections = body.split(/^(?=## )/m);
  const section = sections.find((s) => s.startsWith(heading));
  if (!section) return "";
  return section.replace(/^## .+\n/, "").trim();
}

function getConfigEnvVars(body: string): string[] {
  const config = getSection(body, "## Configuration");
  return [...config.matchAll(/`([A-Z_]+)`/g)].map((m) => m[1]);
}

function getCommandsFromSection(body: string): string[] {
  const section = getSection(body, "## Commands");
  const codeBlock = section.match(/```[\s\S]*?```/);
  if (!codeBlock) return [];
  return codeBlock[0]
    .split("\n")
    .filter((line) => line.startsWith("zora ") || line.startsWith("node "));
}

// ---------------------------------------------------------------------------
// 1. Trading skill safety: a new user doesn't accidentally lose money
// ---------------------------------------------------------------------------
describe("trading skill safety for new users", () => {
  const tradingSkills = skills.filter((s) => s.category === "trading");

  it.each(tradingSkills.map((s) => [s.id, s]))(
    "%s defaults to dry-run so a new user cannot trade on first run",
    (_id, skill) => {
      expect(skill.automation.dryRunByDefault).toBe(true);
      expect(skill.automation.autostart).toBe(false);

      const body = getBody(readSkillMd(skill.id));
      const config = getSection(body, "## Configuration");

      // The LIVE toggle must exist in the config table and default to false
      expect(config).toMatch(/LIVE/);
      expect(config).toContain("`false`");
    },
  );

  it.each(tradingSkills.map((s) => [s.id, s]))(
    "%s setup tells the user to create a dedicated wallet before going live",
    (_id, skill) => {
      const body = getBody(readSkillMd(skill.id));
      const setup = getSection(body, "## Setup");
      expect(setup).toMatch(/zora setup|dedicated wallet/i);
      expect(setup).toMatch(/wallet export|save the key/i);
    },
  );

  it.each(tradingSkills.map((s) => [s.id, s]))(
    "%s mandates are overridable by the user",
    (_id, skill) => {
      const body = getBody(readSkillMd(skill.id));
      const notes = getSection(body, "## Important Notes");
      expect(notes).toContain("### Mandates");
      expect(notes).toMatch(
        /user.*final say|user.*override|user.*explicit/i,
      );
    },
  );
});

// ---------------------------------------------------------------------------
// 2. Trading skill decision clarity: an agent can parse the decision flow
// ---------------------------------------------------------------------------
describe("trading skill decision rules are machine-parseable", () => {
  const tradingIds = ["copy-trader", "momentum-trader"];

  it.each(tradingIds)(
    "%s has a Decision Rules table with Condition and Action columns",
    (id) => {
      const body = getBody(readSkillMd(id));
      const howItWorks = getSection(body, "## How It Works");
      expect(howItWorks).toContain("### Decision Rules");
      expect(howItWorks).toMatch(/\|\s*Condition\s*\|\s*Action\s*\|/);

      // At least 3 rules so the table isn't trivially empty
      const ruleRows = howItWorks
        .split("\n")
        .filter(
          (line) =>
            line.startsWith("|") &&
            !line.includes("Condition") &&
            !line.includes("---"),
        );
      expect(ruleRows.length).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(tradingIds)(
    "%s has an Anti-Patterns table with Pattern and Consequence columns",
    (id) => {
      const body = getBody(readSkillMd(id));
      const notes = getSection(body, "## Important Notes");
      expect(notes).toContain("### Anti-Patterns");
      expect(notes).toMatch(/\|\s*Pattern\s*\|\s*Consequence\s*\|/);
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Troubleshooting covers real failure modes, not just format
// ---------------------------------------------------------------------------
describe("troubleshooting addresses real user problems", () => {
  it.each(["copy-trader", "momentum-trader"])(
    "%s troubleshooting uses structured Symptom/Cause/Fix table",
    (id) => {
      const body = getBody(readSkillMd(id));
      const troubleshooting = getSection(body, "## Troubleshooting");
      expect(troubleshooting).toMatch(
        /\|\s*Symptom\s*\|\s*Cause\s*\|\s*Fix\s*\|/,
      );

      const fixRows = troubleshooting
        .split("\n")
        .filter(
          (line) =>
            line.startsWith("|") &&
            !line.includes("Symptom") &&
            !line.includes("---"),
        );
      expect(fixRows.length).toBeGreaterThanOrEqual(3);
    },
  );

  it("momentum-trader troubleshooting covers 'no candidates' scenario", () => {
    const body = getBody(readSkillMd("momentum-trader"));
    const troubleshooting = getSection(body, "## Troubleshooting");
    expect(troubleshooting).toMatch(/[Nn]o candidates/);
  });

  it("copy-trader troubleshooting covers 'no sources tracked' scenario", () => {
    const body = getBody(readSkillMd("copy-trader"));
    const troubleshooting = getSection(body, "## Troubleshooting");
    expect(troubleshooting).toMatch(/[Nn]o sources/);
  });

  it("momentum-trader troubleshooting covers wrong wallet scenario", () => {
    const body = getBody(readSkillMd("momentum-trader"));
    const troubleshooting = getSection(body, "## Troubleshooting");
    expect(troubleshooting).toMatch(/[Ww]rong wallet/);
  });

  it.each(["momentum-trader", "copy-trader"])(
    "%s troubleshooting covers CLI revert error 'Price moved too much'",
    (id) => {
      const body = getBody(readSkillMd(id));
      const troubleshooting = getSection(body, "## Troubleshooting");
      expect(troubleshooting).toMatch(/[Pp]rice moved too much/);
    },
  );

  it.each(["momentum-trader", "copy-trader"])(
    "%s troubleshooting covers CLI revert error 'Not enough liquidity'",
    (id) => {
      const body = getBody(readSkillMd(id));
      const troubleshooting = getSection(body, "## Troubleshooting");
      expect(troubleshooting).toMatch(/[Nn]ot enough liquidity/);
    },
  );
});

// ---------------------------------------------------------------------------
// 4. Config env vars in SKILL.md match what clawhub.json exposes
// ---------------------------------------------------------------------------
describe("configuration consistency", () => {
  it.each(["copy-trader", "momentum-trader"])(
    "%s SKILL.md config table covers all clawhub.json tunables",
    (id) => {
      const body = getBody(readSkillMd(id));
      const docEnvVars = getConfigEnvVars(body);
      const clawhub = JSON.parse(
        fs.readFileSync(path.join(SKILLS_DIR, id, "clawhub.json"), "utf8"),
      );
      const tunableEnvVars: string[] = clawhub.tunables.map(
        (t: { env: string }) => t.env,
      );

      for (const env of tunableEnvVars) {
        expect(docEnvVars).toContain(env);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 5. Commands in SKILL.md are a superset of commands in skills.ts
// ---------------------------------------------------------------------------
describe("SKILL.md commands cover skills.ts", () => {
  it.each(skills.map((s) => [s.id, s]))(
    "%s SKILL.md lists every CLI command from skills.ts",
    (_id, skill) => {
      const body = getBody(readSkillMd(skill.id));
      const mdCommands = getCommandsFromSection(body);

      // Every command in skills.ts should appear in the SKILL.md code block
      for (const command of skill.commands) {
        const found = mdCommands.some((mdCmd) => mdCmd.trim() === command);
        expect(
          found,
          `skills.ts command "${command}" not found in ${skill.id}/SKILL.md`,
        ).toBe(true);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 6. Agent discovery → install → use journey
// ---------------------------------------------------------------------------
describe("agent install journey", () => {
  it("install commands point to a reachable skill-md URL pattern", () => {
    for (const skill of skills) {
      const commands = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      expect(commands.curl).toBe(
        `curl -sL ${TEST_BASE_URL}/skills/${skill.id}/skill-md`,
      );
    }
  });

  it("quick install and full install agree on runtime commands", () => {
    for (const skill of skills) {
      const full = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      const quick = getSkillQuickInstallCommands(skill, TEST_BASE_URL);
      expect(full.claude).toBe(quick.claude);
      expect(full.amp).toBe(quick.amp);
      expect(full.openclaw).toBe(quick.openclaw);
    }
  });

  it("install-all points at llms.txt, not individual skills", () => {
    const commands = getInstallAllCommands(TEST_BASE_URL);
    expect(commands.claude).toContain("llms.txt");
    expect(commands.claude).not.toContain("skill-md");
  });
});

// ---------------------------------------------------------------------------
// 7. Wallet-free skills are approachable without setup friction
// ---------------------------------------------------------------------------
describe("wallet-free skills are approachable", () => {
  // Skills that don't require any wallet or private key
  const walletFreeSkills = skills.filter(
    (s) => !s.requires.env.includes("ZORA_PRIVATE_KEY"),
  );

  it("at least one skill works without a wallet", () => {
    expect(walletFreeSkills.length).toBeGreaterThanOrEqual(1);
  });

  it.each(walletFreeSkills.map((s) => [s.id, s]))(
    "%s setup does not require wallet creation",
    (_id, skill) => {
      const body = getBody(readSkillMd(skill.id));
      const setup = getSection(body, "## Setup");
      expect(setup).not.toMatch(/zora setup --create/);
    },
  );

  it.each(walletFreeSkills.map((s) => [s.id, s]))(
    "%s has no buy or sell commands",
    (_id, skill) => {
      for (const command of skill.commands) {
        expect(command).not.toContain("zora buy");
        expect(command).not.toContain("zora sell");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 8. Example output matches the skill's actual purpose
// ---------------------------------------------------------------------------
describe("example output reflects the user scenario", () => {
  it("momentum-trader example shows a dry-run with candidates and positions", () => {
    const body = getBody(readSkillMd("momentum-trader"));
    const example = getSection(body, "## Example Output");
    expect(example).toContain("dry-run");
    expect(example).toMatch(/[Cc]andidate/);
    expect(example).toMatch(/position/i);
  });

  it("copy-trader example shows source tracking and a dry-run copy", () => {
    const body = getBody(readSkillMd("copy-trader"));
    const example = getSection(body, "## Example Output");
    expect(example).toContain("dry-run");
    expect(example).toMatch(/[Ss]ource/);
    expect(example).toMatch(/[Cc]opy|[Qq]uote/);
  });

  it("trend-scout example shows trending data", () => {
    const body = getBody(readSkillMd("trend-scout"));
    const example = getSection(body, "## Example Output");
    expect(example).toMatch(/[Tt]rend/);
  });

  it("briefing-bot example shows a structured report", () => {
    const body = getBody(readSkillMd("briefing-bot"));
    const example = getSection(body, "## Example Output");
    expect(example).toMatch(/[Bb]riefing|[Dd]igest|[Mm]arket/);
  });

  it("portfolio-scout example shows wallet positions", () => {
    const body = getBody(readSkillMd("portfolio-scout"));
    const example = getSection(body, "## Example Output");
    expect(example).toMatch(/[Pp]osition|[Bb]alance|[Ss]pendable/);
  });
});
