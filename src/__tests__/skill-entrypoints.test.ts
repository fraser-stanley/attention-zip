import { afterEach, describe, expect, it } from "vitest";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "../..");

type StubScenario = Record<string, unknown>;

const TEMP_DIRS: string[] = [];

function keyOf(args: string[]) {
  return JSON.stringify(args);
}

function createCoin({
  name,
  address,
  marketCap = "1000000",
  marketCapDelta24h = "100000",
  volume24h = "100000",
  uniqueHolders = 100,
}: {
  name: string;
  address: string;
  marketCap?: string;
  marketCapDelta24h?: string;
  volume24h?: string;
  uniqueHolders?: number;
}) {
  return {
    name,
    address,
    marketCap,
    marketCapDelta24h,
    volume24h,
    uniqueHolders,
  };
}

function createBalanceCoin({
  name,
  address,
  usdValue,
  balance = "10",
  priceUsd = "1",
}: {
  name: string;
  address: string;
  usdValue: number;
  balance?: string;
  priceUsd?: string;
}) {
  return {
    name,
    address,
    balance,
    usdValue,
    priceUsd,
  };
}

function createHarness(scenario: StubScenario) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "zora-skill-test-"));
  const homeDir = path.join(tempDir, "home");
  const binDir = path.join(tempDir, "bin");
  const stubDataPath = path.join(tempDir, "stub-data.json");
  const stubCountsDir = path.join(tempDir, "stub-counts");
  const stubLogPath = path.join(tempDir, "stub-log.jsonl");
  const stubBinaryPath = path.join(binDir, "zora");

  TEMP_DIRS.push(tempDir);
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  mkdirSync(stubCountsDir, { recursive: true });
  writeFileSync(stubDataPath, JSON.stringify(scenario, null, 2));
  writeFileSync(stubLogPath, "");

  writeFileSync(
    stubBinaryPath,
    `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dataPath = process.env.ZORA_STUB_DATA;
const countsDir = process.env.ZORA_STUB_COUNTS_DIR;
const logPath = process.env.ZORA_STUB_LOG;
const args = process.argv.slice(2);
const key = JSON.stringify(args);
const scenario = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const rawResponse = scenario[key];

if (rawResponse === undefined) {
  process.stderr.write(\`Missing zora stub response for \${key}\\n\`);
  process.exit(1);
}

const counterPath = path.join(
  countsDir,
  Buffer.from(key).toString("hex").slice(0, 160),
);
const index = fs.existsSync(counterPath)
  ? Number(fs.readFileSync(counterPath, "utf8")) || 0
  : 0;
const selectedResponse = Array.isArray(rawResponse)
  ? rawResponse[Math.min(index, rawResponse.length - 1)]
  : rawResponse;
const response =
  selectedResponse &&
  typeof selectedResponse === "object" &&
  ("stdout" in selectedResponse ||
    "stderr" in selectedResponse ||
    "exitCode" in selectedResponse)
    ? selectedResponse
    : { stdout: selectedResponse };

fs.writeFileSync(counterPath, String(index + 1));
fs.appendFileSync(logPath, JSON.stringify({ args }) + "\\n");

if (response.stderr) {
  process.stderr.write(response.stderr);
}

if (response.stdout !== undefined) {
  if (typeof response.stdout === "string") {
    process.stdout.write(response.stdout);
  } else {
    process.stdout.write(JSON.stringify(response.stdout, null, 2));
  }
}

process.exit(response.exitCode ?? 0);
`,
  );
  chmodSync(stubBinaryPath, 0o755);

  function runSkill(skillId: string, env: Record<string, string> = {}) {
    const scriptPath = path.join(ROOT, skillId, "scripts", "run.mjs");
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
        ZORA_STUB_DATA: stubDataPath,
        ZORA_STUB_COUNTS_DIR: stubCountsDir,
        ZORA_STUB_LOG: stubLogPath,
        ...env,
      },
    });

    return result;
  }

  function readSkillState(skillId: string) {
    return JSON.parse(
      readFileSync(
        path.join(
          homeDir,
          ".config",
          "zora-agent-skills",
          skillId,
          "state.json",
        ),
        "utf8",
      ),
    );
  }

  function writeSkillState(skillId: string, state: unknown) {
    const skillDir = path.join(
      homeDir,
      ".config",
      "zora-agent-skills",
      skillId,
    );
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      path.join(skillDir, "state.json"),
      JSON.stringify(state, null, 2),
    );
  }

  function readJournal(skillId: string) {
    const journalPath = path.join(
      homeDir,
      ".config",
      "zora-agent-skills",
      skillId,
      "journal.jsonl",
    );
    return readFileSync(journalPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  function readLog() {
    const content = readFileSync(stubLogPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);
    return content.map((line) => JSON.parse(line) as { args: string[] });
  }

  return {
    homeDir,
    runSkill,
    readSkillState,
    writeSkillState,
    readJournal,
    readLog,
  };
}

function assertSuccess(
  result: ReturnType<ReturnType<typeof createHarness>["runSkill"]>,
) {
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
}

afterEach(() => {
  while (TEMP_DIRS.length > 0) {
    rmSync(TEMP_DIRS.pop()!, { recursive: true, force: true });
  }
});

describe("managed skill entrypoints", () => {
  it("trend-scout stores state and reports entrants on later runs", () => {
    const oldTrend = createCoin({
      name: "Old Trend",
      address: "0x1000000000000000000000000000000000000001",
      marketCap: "100000",
      marketCapDelta24h: "10000",
      volume24h: "50000",
    });
    const freshTrend = createCoin({
      name: "Fresh Trend",
      address: "0x1000000000000000000000000000000000000002",
      marketCap: "250000",
      marketCapDelta24h: "50000",
      volume24h: "110000",
    });

    const harness = createHarness({
      [keyOf([
        "explore",
        "--sort",
        "trending",
        "--type",
        "trend",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [oldTrend] }, { coins: [freshTrend, oldTrend] }],
      [keyOf([
        "explore",
        "--sort",
        "new",
        "--type",
        "trend",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [oldTrend] }, { coins: [oldTrend] }],
      [keyOf([
        "explore",
        "--sort",
        "volume",
        "--type",
        "trend",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [oldTrend] }, { coins: [oldTrend] }],
      [keyOf([
        "explore",
        "--sort",
        "mcap",
        "--type",
        "trend",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [oldTrend] }, { coins: [oldTrend] }],
    });

    assertSuccess(harness.runSkill("trend-scout"));
    const second = harness.runSkill("trend-scout", {
      ZORA_TREND_WATCHLIST: "Fresh Trend",
    });

    assertSuccess(second);
    expect(second.stdout).toContain("Trend Scout");
    expect(second.stdout).toContain("Fresh Trend entered the trending view");
    expect(second.stdout).toContain(
      "Fresh Trend is live in the current trend scan",
    );

    const state = harness.readSkillState("trend-scout");
    expect(state.snapshots.trending).toContain(
      freshTrend.address.toLowerCase(),
    );
  });

  it("creator-pulse detects watchlist deltas and featured entrants", () => {
    const jacob = createCoin({
      name: "jacob",
      address: "0x2000000000000000000000000000000000000001",
      marketCap: "8100000",
      volume24h: "100000",
      uniqueHolders: 100,
    });
    const alys = createCoin({
      name: "alysaliu",
      address: "0x2000000000000000000000000000000000000002",
      marketCap: "4200000",
      volume24h: "90000",
      uniqueHolders: 200,
    });

    const harness = createHarness({
      [keyOf([
        "explore",
        "--sort",
        "featured",
        "--type",
        "creator-coin",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [jacob] }, { coins: [jacob, alys] }],
      [keyOf([
        "explore",
        "--sort",
        "trending",
        "--type",
        "creator-coin",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [jacob] }, { coins: [jacob] }],
      [keyOf([
        "explore",
        "--sort",
        "volume",
        "--type",
        "creator-coin",
        "--limit",
        "8",
        "--json",
      ])]: [{ coins: [jacob] }, { coins: [jacob] }],
      [keyOf(["get", "jacob", "--type", "creator-coin", "--json"])]: [
        {
          ...jacob,
          volume24h: "100000",
          uniqueHolders: 100,
        },
        {
          ...jacob,
          volume24h: "120000",
          uniqueHolders: 130,
        },
      ],
    });

    assertSuccess(
      harness.runSkill("creator-pulse", { ZORA_CREATOR_WATCHLIST: "jacob" }),
    );
    const second = harness.runSkill("creator-pulse", {
      ZORA_CREATOR_WATCHLIST: "jacob",
    });

    assertSuccess(second);
    expect(second.stdout).toContain(
      "jacob volume moved +20.0% since the last run",
    );
    expect(second.stdout).toContain("jacob holder count moved +30");
    expect(second.stdout).toContain(
      "alysaliu entered the featured creator view",
    );

    const state = harness.readSkillState("creator-pulse");
    expect(state.featured).toContain(alys.address.toLowerCase());
  });

  it("briefing-bot tracks new launches between runs and portfolio overlap", () => {
    const looks = createCoin({
      name: "looksmaxxing",
      address: "0x3000000000000000000000000000000000000001",
      marketCap: "2300000",
      marketCapDelta24h: "250000",
      volume24h: "450200",
    });
    const frog = createCoin({
      name: "frog market",
      address: "0x3000000000000000000000000000000000000002",
      marketCap: "1100000",
      marketCapDelta24h: "50000",
      volume24h: "3100000",
    });
    const oldLaunch = createCoin({
      name: "Old Post",
      address: "0x3000000000000000000000000000000000000003",
      marketCap: "12000",
      marketCapDelta24h: "1000",
      volume24h: "5000",
    });
    const freshLaunch = createCoin({
      name: "Fresh Post",
      address: "0x3000000000000000000000000000000000000004",
      marketCap: "45000",
      marketCapDelta24h: "3000",
      volume24h: "9000",
    });
    const hyper = createCoin({
      name: "hyperpop",
      address: "0x3000000000000000000000000000000000000005",
      marketCap: "950000",
      marketCapDelta24h: "175000",
      volume24h: "210000",
    });

    const harness = createHarness({
      [keyOf(["explore", "--sort", "trending", "--limit", "5", "--json"])]: [
        { coins: [looks] },
        { coins: [looks] },
      ],
      [keyOf(["explore", "--sort", "volume", "--limit", "5", "--json"])]: [
        { coins: [frog] },
        { coins: [frog] },
      ],
      [keyOf(["explore", "--sort", "new", "--limit", "5", "--json"])]: [
        { coins: [oldLaunch] },
        { coins: [freshLaunch] },
      ],
      [keyOf(["explore", "--sort", "gainers", "--limit", "5", "--json"])]: [
        { coins: [hyper] },
        { coins: [hyper] },
      ],
      [keyOf(["balance", "--json"])]: [
        {
          wallet: [
            { symbol: "ETH", balance: "0.42", usdValue: 1000, priceUsd: 2500 },
          ],
          coins: [{ name: "looksmaxxing", address: looks.address }],
        },
        {
          wallet: [
            { symbol: "ETH", balance: "0.42", usdValue: 1000, priceUsd: 2500 },
          ],
          coins: [{ name: "looksmaxxing", address: looks.address }],
        },
      ],
    });

    assertSuccess(harness.runSkill("briefing-bot"));
    const second = harness.runSkill("briefing-bot");

    assertSuccess(second);
    expect(second.stdout).toContain("Fresh Post");
    expect(second.stdout).toContain(
      "looksmaxxing is both held and active in the market scans",
    );

    const state = harness.readSkillState("briefing-bot");
    expect(state.scans.new).toContain(freshLaunch.address.toLowerCase());
  });

  it("portfolio-scout reports drawdown, concentration, new positions, and closed positions", () => {
    const jacobA = createBalanceCoin({
      name: "jacob",
      address: "0x4000000000000000000000000000000000000001",
      usdValue: 120,
    });
    const penguin = createBalanceCoin({
      name: "based penguin",
      address: "0x4000000000000000000000000000000000000002",
      usdValue: 80,
    });
    const jacobB = createBalanceCoin({
      name: "jacob",
      address: "0x4000000000000000000000000000000000000001",
      usdValue: 40,
    });
    const hyper = createBalanceCoin({
      name: "hyperpop",
      address: "0x4000000000000000000000000000000000000003",
      usdValue: 30,
    });

    const harness = createHarness({
      [keyOf(["balance", "--json"])]: [
        {
          wallet: [
            { symbol: "ETH", balance: "0.42", usdValue: 1000, priceUsd: 2500 },
            { symbol: "USDC", balance: "183.20", usdValue: 183.2, priceUsd: 1 },
          ],
          coins: [jacobA, penguin],
        },
        {
          wallet: [
            { symbol: "ETH", balance: "0.40", usdValue: 950, priceUsd: 2375 },
            { symbol: "USDC", balance: "120.00", usdValue: 120, priceUsd: 1 },
          ],
          coins: [jacobB, hyper],
        },
      ],
    });

    assertSuccess(harness.runSkill("portfolio-scout"));
    const second = harness.runSkill("portfolio-scout");

    assertSuccess(second);
    expect(second.stdout).toContain(
      "Concentration warning: jacob is above the 35% threshold",
    );
    expect(second.stdout).toContain("Run-to-run drawdown is 65.0%");
    expect(second.stdout).toContain(
      "hyperpop is a new position since the last run",
    );
    expect(second.stdout).toContain("based penguin is no longer held");
  });

  it("momentum-trader stays in dry-run mode and journals quoted entries", () => {
    const hyper = createCoin({
      name: "hyperpop",
      address: "0x5000000000000000000000000000000000000001",
      marketCap: "950000",
      marketCapDelta24h: "210000",
      volume24h: "210000",
    });

    const harness = createHarness({
      [keyOf([
        "balance",
        "coins",
        "--sort",
        "usd-value",
        "--limit",
        "20",
        "--json",
      ])]: { coins: [] },
      [keyOf(["explore", "--sort", "gainers", "--limit", "12", "--json"])]: {
        coins: [hyper],
      },
      [keyOf(["explore", "--sort", "trending", "--limit", "12", "--json"])]: {
        coins: [hyper],
      },
      [keyOf(["get", hyper.address, "--json"])]: hyper,
      [keyOf([
        "buy",
        hyper.address,
        "--eth",
        "0.01",
        "--quote",
        "--slippage",
        "3",
        "-o",
        "json",
      ])]: {
        action: "quote",
        coin: "HYPER",
        address: hyper.address,
        estimated: { amount: "263", symbol: "HYPER" },
        slippage: 1.2,
      },
    });

    const result = harness.runSkill("momentum-trader", {
      ZORA_MOMENTUM_LIVE: "false",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: dry-run");
    expect(result.stdout).toContain("Action: dry-run only, no order sent");

    const journal = harness.readJournal("momentum-trader");
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      action: "buy-quote",
      live: false,
      address: hyper.address,
    });

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("momentum-trader can execute a live trailing-stop exit and skip entry during cooldown", () => {
    const look = createBalanceCoin({
      name: "looksmaxxing",
      address: "0x6000000000000000000000000000000000000001",
      usdValue: 80,
      balance: "100",
      priceUsd: "8",
    });

    const harness = createHarness({
      [keyOf([
        "balance",
        "coins",
        "--sort",
        "usd-value",
        "--limit",
        "20",
        "--json",
      ])]: { coins: [look] },
      [keyOf([
        "sell",
        look.address,
        "--percent",
        "100",
        "--to",
        "eth",
        "--slippage",
        "3",
        "-o",
        "json",
        "--yes",
      ])]: {
        action: "sell",
        coin: "LOOK",
        address: look.address,
        sold: { amount: "100", raw: "100", symbol: "LOOK" },
        received: {
          amount: "0.04",
          raw: "40000000000000000",
          symbol: "ETH",
          source: "quote",
        },
        tx: "0xsell",
      },
    });

    harness.writeSkillState("momentum-trader", {
      updatedAt: "2026-03-22T12:00:00.000Z",
      lastTradeAt: null,
      spendWindowStartedAt: "2026-03-22T12:00:00.000Z",
      spentWindowEth: 0,
      positions: {
        [look.address.toLowerCase()]: {
          address: look.address,
          name: "looksmaxxing",
          symbol: "LOOK",
          openedAt: "2026-03-22T12:00:00.000Z",
          balance: "100",
          entryPriceUsd: 10,
          peakPriceUsd: 10,
          lastPriceUsd: 10,
        },
      },
    });

    const result = harness.runSkill("momentum-trader", {
      ZORA_MOMENTUM_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: live");
    expect(result.stdout).toContain("- Sold looksmaxxing, tx 0xsell");
    expect(result.stdout).toContain("Entry scan skipped: cooldown active");

    const journal = harness.readJournal("momentum-trader");
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      action: "sell",
      live: true,
      address: look.address,
      tx: "0xsell",
    });

    const state = harness.readSkillState("momentum-trader");
    expect(state.positions).toEqual({});
    expect(typeof state.lastTradeAt).toBe("string");
  });
});
