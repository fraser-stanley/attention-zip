import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import {
  skills,
  getInstallAllCommands,
  getSkillById,
  getSkillQuickInstallCommands,
  getSkillRuntimeCommands,
} from "@/lib/skills";
import { CLI_REFERENCE } from "@/lib/discovery";

const ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(ROOT, "skills");

describe("skills array", () => {
  it("has exactly 6 skills", () => {
    expect(skills).toHaveLength(6);
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
      expect(fs.existsSync(path.join(SKILLS_DIR, id))).toBe(true);
      expect(fs.existsSync(path.join(SKILLS_DIR, id, "SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(SKILLS_DIR, id, "clawhub.json"))).toBe(true);
    },
  );

  it.each(skills.map((skill) => skill.id))(
    "%s SKILL.md name matches skills.ts id",
    (id) => {
      const content = fs.readFileSync(path.join(SKILLS_DIR, id, "SKILL.md"), "utf8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      expect(match).toBeTruthy();
      const frontmatter = yaml.parse(match![1]);
      expect(frontmatter.name).toBe(id);
    },
  );
});

const VALID_EXPLORE_SORTS = ["mcap", "volume", "new", "trending", "featured"];
const VALID_EXPLORE_TYPES = ["all", "trend", "creator-coin", "post"];
const VALID_BALANCE_SUBCOMMANDS = ["spendable", "coins"];
const VALID_BALANCE_COINS_SORTS = [
  "usd-value",
  "balance",
  "market-cap",
  "price-change",
];
const VALID_TOKEN_ASSETS = ["eth", "usdc", "zora"];
const VALID_PRICE_HISTORY_INTERVALS = ["1h", "24h", "1w", "1m", "ALL"];

function extractFlag(command: string, flag: string): string | null {
  const regex = new RegExp(`${flag}\\s+(\\S+)`);
  const match = command.match(regex);
  return match ? match[1] : null;
}

describe("CLI compatibility", () => {
  const allCommands = skills.flatMap((skill) =>
    skill.commands.map((command) => ({ skill: skill.id, command })),
  );

  describe("explore --sort values match CLI", () => {
    const exploreCmds = allCommands.filter(({ command }) =>
      command.includes("zora explore"),
    );

    it.each(exploreCmds)(
      "$skill: $command",
      ({ command }) => {
        const sort = extractFlag(command, "--sort");
        if (sort) {
          expect(VALID_EXPLORE_SORTS).toContain(sort);
        }
      },
    );
  });

  describe("explore --type values match CLI", () => {
    const exploreCmds = allCommands.filter(
      ({ command }) =>
        command.includes("zora explore") && command.includes("--type"),
    );

    it.each(exploreCmds)(
      "$skill: $command",
      ({ command }) => {
        const type = extractFlag(command, "--type");
        if (type) {
          expect(VALID_EXPLORE_TYPES).toContain(type);
        }
      },
    );
  });

  describe("balance subcommands match CLI", () => {
    const balanceCmds = allCommands.filter(({ command }) =>
      command.includes("zora balance"),
    );

    it.each(balanceCmds)(
      "$skill: $command",
      ({ command }) => {
        const parts = command.replace("zora balance", "").trim().split(/\s+/);
        const subcommand = parts[0];
        if (subcommand && !subcommand.startsWith("-")) {
          expect(VALID_BALANCE_SUBCOMMANDS).toContain(subcommand);
        }
      },
    );
  });

  describe("balance coins --sort values match CLI", () => {
    const coinsCmds = allCommands.filter(
      ({ command }) =>
        command.includes("zora balance coins") && command.includes("--sort"),
    );

    it.each(coinsCmds)(
      "$skill: $command",
      ({ command }) => {
        const sort = extractFlag(command, "--sort");
        if (sort) {
          expect(VALID_BALANCE_COINS_SORTS).toContain(sort);
        }
      },
    );
  });

  describe("buy/sell --token/--to values match CLI", () => {
    const tradeCmds = allCommands.filter(
      ({ command }) =>
        (command.includes("zora buy") || command.includes("zora sell")) &&
        (command.includes("--token") || command.includes("--to")),
    );

    if (tradeCmds.length > 0) {
      it.each(tradeCmds)(
        "$skill: $command",
        ({ command }) => {
          const token = extractFlag(command, "--token");
          const to = extractFlag(command, "--to");
          if (token && !token.startsWith("<")) {
            expect(VALID_TOKEN_ASSETS).toContain(token);
          }
          if (to && !to.startsWith("<")) {
            expect(VALID_TOKEN_ASSETS).toContain(to);
          }
        },
      );
    }
  });

  describe("price-history --interval values match CLI", () => {
    const phCmds = allCommands.filter(
      ({ command }) =>
        command.includes("zora price-history") &&
        command.includes("--interval"),
    );

    if (phCmds.length > 0) {
      it.each(phCmds)(
        "$skill: $command",
        ({ command }) => {
          const interval = extractFlag(command, "--interval");
          if (interval) {
            expect(VALID_PRICE_HISTORY_INTERVALS).toContain(interval);
          }
        },
      );
    }
  });

  describe("all commands use --json", () => {
    it.each(allCommands)(
      "$skill: $command",
      ({ command }) => {
        if (!command.startsWith("node ")) {
          expect(command).toContain("--json");
        }
      },
    );
  });

  describe("entrypoint scripts use valid CLI options", () => {
    const SKILL_DIRS = skills
      .filter((s) => s.automation.entrypoint)
      .map((s) => s.id);

    it.each(SKILL_DIRS)(
      "%s/scripts/run.mjs only uses valid --sort values for their context",
      (id) => {
        const script = fs.readFileSync(
          path.join(SKILLS_DIR, id, "scripts", "run.mjs"),
          "utf8",
        );
        // Match array-style CLI args: ["explore", ..., "--sort", "value"]
        // or ["balance", "coins", ..., "--sort", "value"]
        const exploreSortMatches = script.matchAll(
          /["']explore["'][\s\S]*?["']--sort["'],\s*\n?\s*["']([^"']+)["']/g,
        );
        for (const match of exploreSortMatches) {
          expect(VALID_EXPLORE_SORTS).toContain(match[1]);
        }
        const balanceCoinsSortMatches = script.matchAll(
          /["']balance["'][\s\S]*?["']coins["'][\s\S]*?["']--sort["'],\s*\n?\s*["']([^"']+)["']/g,
        );
        for (const match of balanceCoinsSortMatches) {
          expect(VALID_BALANCE_COINS_SORTS).toContain(match[1]);
        }
      },
    );

    it.each(SKILL_DIRS)(
      "%s/scripts/run.mjs only uses valid explore --type values",
      (id) => {
        const script = fs.readFileSync(
          path.join(SKILLS_DIR, id, "scripts", "run.mjs"),
          "utf8",
        );
        const typeMatches = script.matchAll(
          /["']--type["'],\s*\n?\s*["']([^"']+)["']/g,
        );
        for (const match of typeMatches) {
          expect(VALID_EXPLORE_TYPES).toContain(match[1]);
        }
      },
    );

    it.each(SKILL_DIRS)(
      "%s/scripts/run.mjs only uses valid --to/--token asset values",
      (id) => {
        const script = fs.readFileSync(
          path.join(SKILLS_DIR, id, "scripts", "run.mjs"),
          "utf8",
        );
        const toMatches = script.matchAll(
          /["']--to["'],\s*\n?\s*["']([^"']+)["']/g,
        );
        for (const match of toMatches) {
          expect(VALID_TOKEN_ASSETS).toContain(match[1]);
        }
        const tokenMatches = script.matchAll(
          /["']--token["'],\s*\n?\s*["']([^"']+)["']/g,
        );
        for (const match of tokenMatches) {
          expect(VALID_TOKEN_ASSETS).toContain(match[1]);
        }
      },
    );

    it.each(SKILL_DIRS)(
      "%s/scripts/run.mjs passes --json on all zora CLI calls",
      (id) => {
        const script = fs.readFileSync(
          path.join(SKILLS_DIR, id, "scripts", "run.mjs"),
          "utf8",
        );
        const zoraCallBlocks = script.matchAll(
          /runZora\(\[[\s\S]*?\]\)/g,
        );
        for (const match of zoraCallBlocks) {
          expect(match[0]).toContain('"--json"');
        }
      },
    );
  });
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
        it.each(buyCommands)("buy command %s uses --json", (command) => {
          expect(command).toContain("--json");
        });
      }

      if (sellCommands.length > 0) {
        it.each(sellCommands)("sell command %s uses --json", (command) => {
          expect(command).toContain("--json");
        });
      }
    });
  }
});

describe("execution skill safety", () => {
  const copyTrader = skills.find((skill) => skill.id === "copy-trader")!;
  const momentum = skills.find((skill) => skill.id === "momentum-trader")!;
  const readOnly = skills.filter((skill) => skill.risk === "none");

  it("copy-trader has risk: medium", () => {
    expect(copyTrader.risk).toBe("medium");
  });

  it("copy-trader is dry-run by default", () => {
    expect(copyTrader.automation.dryRunByDefault).toBe(true);
  });

  it("copy-trader commands include buy and sell", () => {
    expect(
      copyTrader.commands.some((command) => command.includes("zora buy")),
    ).toBe(true);
    expect(
      copyTrader.commands.some((command) => command.includes("zora sell")),
    ).toBe(true);
  });

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
    expect(commands).toHaveProperty("curl");
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

  it("uses the shorter install prompt format", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.claude).toBe(
      'claude -p "Install Trend Scout from https://example.com/skills/trend-scout/skill-md"',
    );
  });

  it("openclaw uses clawhub install", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.openclaw).toMatch(/^clawhub install /);
  });

  it("manual command clones the source repo", () => {
    const commands = getSkillRuntimeCommands(skills[0], TEST_BASE_URL);
    expect(commands.manual).toContain("git clone --depth 1");
    expect(commands.manual).toContain("attention-zip");
  });

  it("manual install stays as the extra fallback", () => {
    for (const skill of skills) {
      const commands = getSkillRuntimeCommands(skill, TEST_BASE_URL);
      const quickInstall = getSkillQuickInstallCommands(skill, TEST_BASE_URL);

      expect(commands.openclaw).toBe(quickInstall.openclaw);
      expect(commands.claude).toBe(quickInstall.claude);
      expect(commands.manual).toContain(`cd attention-zip/skills/${skill.id}`);
    }
  });
});

describe("getInstallAllCommands", () => {
  it("points runtimes at llms.txt for the all-skills install flow", () => {
    const commands = getInstallAllCommands(TEST_BASE_URL);

    expect(commands.claude).toBe(
      'claude -p "Install skills from https://example.com/llms.txt"',
    );
    expect(commands.amp).toBe(
      'amp "Install skills from https://example.com/llms.txt"',
    );
    expect(commands.codex).toBe(
      'codex "Install skills from https://example.com/llms.txt"',
    );
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

describe("CLI_REFERENCE in discovery.ts", () => {
  const exploreRef = CLI_REFERENCE.find((r) => r.command === "zora explore");
  const balanceRef = CLI_REFERENCE.find((r) => r.command === "zora balance");
  const priceHistoryRef = CLI_REFERENCE.find(
    (r) => r.command === "zora price-history",
  );

  it("explore entry documents all valid sort values", () => {
    expect(exploreRef).toBeDefined();
    for (const sort of VALID_EXPLORE_SORTS) {
      expect(exploreRef!.notes).toContain(sort);
    }
  });

  it("explore entry documents all valid type values", () => {
    expect(exploreRef).toBeDefined();
    for (const type of VALID_EXPLORE_TYPES) {
      expect(exploreRef!.notes).toContain(type);
    }
  });

  it("explore entry does not list stale sort values", () => {
    const sortsInNotes = exploreRef!.notes
      .match(/Sorts: ([^.]+)\./)?.[1]
      ?.split(", ")
      .map((s) => s.trim());
    expect(sortsInNotes).toBeDefined();
    for (const sort of sortsInNotes!) {
      expect(VALID_EXPLORE_SORTS).toContain(sort);
    }
  });

  it("explore entry does not list stale type values", () => {
    const typesInNotes = exploreRef!.notes
      .match(/Types: ([^.]+)\./)?.[1]
      ?.split(", ")
      .map((s) => s.trim());
    expect(typesInNotes).toBeDefined();
    for (const type of typesInNotes!) {
      expect(VALID_EXPLORE_TYPES).toContain(type);
    }
  });

  it("balance entry documents valid subcommands", () => {
    expect(balanceRef).toBeDefined();
    for (const sub of VALID_BALANCE_SUBCOMMANDS) {
      expect(balanceRef!.notes + " " + balanceRef!.syntax).toContain(sub);
    }
  });

  it("price-history entry documents all valid interval values", () => {
    expect(priceHistoryRef).toBeDefined();
    for (const interval of VALID_PRICE_HISTORY_INTERVALS) {
      expect(priceHistoryRef!.notes).toContain(interval);
    }
  });

  it("every CLI_REFERENCE entry has syntax containing --json where applicable", () => {
    const jsonCommands = ["zora explore", "zora get", "zora buy", "zora sell", "zora balance", "zora price-history", "zora profile", "zora send"];
    for (const ref of CLI_REFERENCE) {
      if (jsonCommands.includes(ref.command)) {
        expect(ref.syntax).toContain("--json");
      }
    }
  });

  it("CLI_REFERENCE covers all commands used by skills", () => {
    const refCommands = CLI_REFERENCE.map((r) => r.command);
    const skillCommandPrefixes = new Set<string>();
    for (const skill of skills) {
      for (const cmd of skill.commands) {
        const match = cmd.match(/^(zora\s+\S+)/);
        if (match) skillCommandPrefixes.add(match[1]);
      }
    }
    for (const prefix of skillCommandPrefixes) {
      expect(refCommands).toContain(prefix);
    }
  });
});
