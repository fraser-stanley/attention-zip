import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(ROOT, "skills");

// Valid sort options per https://cli.zora.com/llms-full.txt
// Update this set when the Zora CLI adds new sort options.
const VALID_EXPLORE_SORTS = new Set([
  "mcap",
  "volume",
  "new",
  "trending",
  "featured",
]);

const SKILL_DIRS = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => {
    try {
      readFileSync(path.join(SKILLS_DIR, name, "scripts", "run.mjs"), "utf8");
      return true;
    } catch {
      return false;
    }
  });

function extractExploreSorts(source: string): string[] {
  const sorts: string[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes('"--sort"') || lines[i].includes("'--sort'")) {
      const next = lines[i + 1].trim().replace(/[",';]/g, "");
      // Only catch literal sort strings, skip variable references
      if (next && /^[a-z-]+$/.test(next) && next !== "key" && next !== "sort") {
        sorts.push(next);
      }
    }
  }
  return sorts;
}

function extractArraySorts(source: string): string[] {
  const values: string[] = [];
  const arrayMatch = source.match(new RegExp("(?:SCANS|SORTS)\\s*=\\s*\\[([^\\]]+)\\]", "s"));
  if (arrayMatch) {
    for (const m of arrayMatch[1].matchAll(/(?:key:\s*)?["']([a-z-]+)["']/g)) {
      values.push(m[1]);
    }
  }
  return values;
}

describe("CLI compatibility", () => {
  for (const skill of SKILL_DIRS) {
    it(`${skill}/scripts/run.mjs uses only valid explore --sort values`, () => {
      const source = readFileSync(
        path.join(SKILLS_DIR, skill, "scripts", "run.mjs"),
        "utf8",
      );

      const allSorts = [
        ...new Set([...extractArraySorts(source), ...extractExploreSorts(source)]),
      ];

      // Exclude balance-specific sorts (usd-value, price-change)
      const exploreSorts = allSorts.filter(
        (s) => !["usd-value", "price-change"].includes(s),
      );

      for (const sort of exploreSorts) {
        expect(
          VALID_EXPLORE_SORTS.has(sort),
          `${skill} uses invalid explore --sort "${sort}". Valid: ${[...VALID_EXPLORE_SORTS].join(", ")}`,
        ).toBe(true);
      }
    });
  }

  it("skills.ts commands use only valid explore --sort values", () => {
    const source = readFileSync(
      path.join(ROOT, "src", "lib", "skills.ts"),
      "utf8",
    );

    const sortMatches = [...source.matchAll(/zora explore --sort (\S+)/g)];

    for (const match of sortMatches) {
      const sort = match[1];
      expect(
        VALID_EXPLORE_SORTS.has(sort),
        `skills.ts uses invalid explore --sort "${sort}". Valid: ${[...VALID_EXPLORE_SORTS].join(", ")}`,
      ).toBe(true);
    }
  });
});
