import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import os from "os";
import path from "path";
import { spawn, spawnSync } from "child_process";

const ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(ROOT, "skills");

type StubScenario = Record<string, unknown>;
type PublicApiScenario = Record<string, unknown>;
type SkillRunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

const TEMP_DIRS: string[] = [];
const TEMP_SERVERS: Array<{ close: () => void }> = [];

function keyOf(args: string[]) {
  return JSON.stringify(args);
}

function keyOfRequest(
  pathname: string,
  query: Record<
    string,
    string | number | boolean | Array<string | number | boolean> | null | undefined
  > = {},
) {
  const entries: Array<[string, string]> = [];

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        entries.push([key, String(value)]);
      }
      continue;
    }

    entries.push([key, String(rawValue)]);
  }

  entries.sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) {
      return leftValue.localeCompare(rightValue);
    }
    return leftKey.localeCompare(rightKey);
  });

  const search = new URLSearchParams(entries).toString();
  return search ? `${pathname}?${search}` : pathname;
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

function createProfileResponse({
  id,
  handle,
  walletAddress,
  linkedWallets,
}: {
  id: string;
  handle?: string;
  walletAddress: string;
  linkedWallets?: Array<{ walletAddress: string; walletType?: string }>;
}) {
  return {
    profile: {
      id,
      handle,
      publicWallet: {
        walletAddress,
      },
      linkedWallets: {
        edges: (linkedWallets ?? [{ walletAddress }]).map((wallet) => ({
          node: {
            walletAddress: wallet.walletAddress,
            walletType: wallet.walletType ?? "EOA",
          },
        })),
      },
    },
  };
}

function createProfileBalancesResponse(
  balances: Array<{
    address: string;
    name: string;
    symbol: string;
    balance: number;
    balanceUsd: number;
    priceUsd?: number;
  }>,
) {
  return {
    profile: {
      coinBalances: {
        edges: balances.map((balance) => ({
          node: {
            balance: String(balance.balance),
            balanceUsd: String(balance.balanceUsd),
            coin: {
              address: balance.address,
              name: balance.name,
              symbol: balance.symbol,
              tokenPrice: {
                priceInUsdc: String(balance.priceUsd ?? 1),
              },
            },
          },
        })),
      },
    },
  };
}

function createCoinSwapsResponse(
  swaps: Array<{
    id: string;
    senderAddress?: string;
    recipientAddress?: string;
    transactionHash: string;
    blockTimestamp: string;
    activityType: "BUY" | "SELL";
    coinAmount?: string;
    quoteAmount?: number;
    quoteCurrencyAddress?: string;
    quotePriceUsdc?: string | number;
  }>,
) {
  return {
    zora20Token: {
      swapActivities: {
        count: swaps.length,
        pageInfo: {
          endCursor: swaps.length > 0 ? `cursor_${swaps.length}` : null,
          hasNextPage: false,
        },
        edges: swaps.map((swap) => ({
          node: {
            id: swap.id,
            senderAddress: swap.senderAddress,
            recipientAddress: swap.recipientAddress,
            transactionHash: swap.transactionHash,
            blockTimestamp: swap.blockTimestamp,
            activityType: swap.activityType,
            coinAmount: swap.coinAmount ?? "0",
            currencyAmountWithPrice: {
              priceUsdc: String(swap.quotePriceUsdc ?? 1),
              currencyAmount: {
                currencyAddress:
                  swap.quoteCurrencyAddress ??
                  "0x9999999999999999999999999999999999999999",
                amountDecimal: swap.quoteAmount ?? 0,
              },
            },
          },
        })),
      },
    },
  };
}

function createTraderLeaderboardResponse(
  traders: Array<{
    handle: string;
    profileId: string;
    score?: number;
    weekVolumeUsd?: number;
  }>,
) {
  return {
    exploreTraderLeaderboard: {
      edges: traders.map((trader) => ({
        node: {
          score: trader.score ?? 0,
          weekVolumeUsd: trader.weekVolumeUsd ?? 0,
          traderProfile: {
            handle: trader.handle,
            id: trader.profileId,
          },
        },
      })),
    },
  };
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
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

  const baseEnv = {
    ...process.env,
    HOME: homeDir,
    PATH: `${binDir}:${process.env.PATH ?? ""}`,
    ZORA_STUB_DATA: stubDataPath,
    ZORA_STUB_COUNTS_DIR: stubCountsDir,
    ZORA_STUB_LOG: stubLogPath,
  };

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
    const scriptPath = path.join(SKILLS_DIR, skillId, "scripts", "run.mjs");
    const result = spawnSync(process.execPath, [scriptPath], {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...baseEnv,
        ...env,
      },
    });

    return result;
  }

  function runSkillAsync(skillId: string, env: Record<string, string> = {}) {
    const scriptPath = path.join(SKILLS_DIR, skillId, "scripts", "run.mjs");

    return new Promise<SkillRunResult>((resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath], {
        cwd: ROOT,
        env: {
          ...baseEnv,
          ...env,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (status) => {
        resolve({
          status,
          stdout,
          stderr,
        });
      });
    });
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
    runSkillAsync,
    readSkillState,
    writeSkillState,
    readJournal,
    readLog,
  };
}

async function createPublicApiHarness(scenario: PublicApiScenario) {
  const requestLog: string[] = [];
  const counters = new Map<string, number>();

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const entries = Array.from(url.searchParams.entries()).sort(
      ([leftKey, leftValue], [rightKey, rightValue]) => {
        if (leftKey === rightKey) {
          return leftValue.localeCompare(rightValue);
        }
        return leftKey.localeCompare(rightKey);
      },
    );
    const key = entries.length > 0
      ? `${url.pathname}?${new URLSearchParams(entries).toString()}`
      : url.pathname;

    requestLog.push(key);

    const rawResponse = scenario[key];
    if (rawResponse === undefined) {
      response.statusCode = 500;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          error: `Missing public API stub response for ${key}`,
        }),
      );
      return;
    }

    const index = counters.get(key) ?? 0;
    const selectedResponse = Array.isArray(rawResponse)
      ? rawResponse[Math.min(index, rawResponse.length - 1)]
      : rawResponse;
    counters.set(key, index + 1);

    const payload: {
      status?: number;
      body?: unknown;
      headers?: Record<string, string>;
    } =
      selectedResponse &&
      typeof selectedResponse === "object" &&
      ("status" in selectedResponse ||
        "body" in selectedResponse ||
        "headers" in selectedResponse)
        ? (selectedResponse as {
            status?: number;
            body?: unknown;
            headers?: Record<string, string>;
          })
        : { body: selectedResponse };

    response.statusCode = payload.status ?? 200;
    response.setHeader("content-type", "application/json");
    response.setHeader("connection", "close");

    for (const [name, value] of Object.entries(payload.headers ?? {})) {
      response.setHeader(name, value);
    }

    if (payload.body === undefined) {
      response.end("");
      return;
    }

    if (typeof payload.body === "string") {
      response.end(payload.body);
      return;
    }

    response.end(JSON.stringify(payload.body));
  });

  TEMP_SERVERS.push(server);

  const baseUrl = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to start public API fixture server"));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

  return {
    baseUrl,
    readPublicLog: () => [...requestLog],
  };
}

async function createHarnessWithPublicApi(
  scenario: StubScenario,
  publicApiScenario: PublicApiScenario,
) {
  const harness = createHarness(scenario);
  const publicApi = await createPublicApiHarness(publicApiScenario);

  return {
    ...harness,
    runSkill(skillId: string, env: Record<string, string> = {}) {
      return harness.runSkillAsync(skillId, {
        ZORA_PUBLIC_API_BASE_URL: publicApi.baseUrl,
        ...env,
      });
    },
    readPublicLog: publicApi.readPublicLog,
  };
}

function assertSuccess(result: { status: number | null; stderr: string }) {
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
}

afterEach(() => {
  while (TEMP_SERVERS.length > 0) {
    TEMP_SERVERS.pop()?.close();
  }
  while (TEMP_DIRS.length > 0) {
    rmSync(TEMP_DIRS.pop()!, { recursive: true, force: true });
  }
});

describe("managed skill entrypoints", { timeout: 30_000 }, () => {
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
      [keyOf(["get", "creator-coin", "jacob", "--json"])]: [
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
      [keyOf(["explore", "--sort", "volume", "--limit", "12", "--json"])]: {
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
        "--json",
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
        "--json",
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
    expect(result.stdout).toContain("Sold looksmaxxing (trailing-stop), tx 0xsell");
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

  it("momentum-trader fires stop-loss when price drops far enough from entry", () => {
    const look = createBalanceCoin({
      name: "looksmaxxing",
      address: "0x6000000000000000000000000000000000000001",
      usdValue: 70,
      balance: "100",
      priceUsd: "7",
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
        "--json",
        "--yes",
      ])]: {
        action: "sell",
        coin: "LOOK",
        address: look.address,
        sold: { amount: "100", raw: "100", symbol: "LOOK" },
        received: {
          amount: "0.03",
          raw: "30000000000000000",
          symbol: "ETH",
          source: "quote",
        },
        tx: "0xstoploss",
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
          peakPriceUsd: 12,
          lastPriceUsd: 10,
        },
      },
      recentExits: {},
      runCount: 5,
    });

    const result = harness.runSkill("momentum-trader", {
      ZORA_MOMENTUM_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("stop-loss");
    expect(result.stdout).toContain("Sold looksmaxxing");

    const journal = harness.readJournal("momentum-trader");
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      action: "sell",
      live: true,
      address: look.address,
      exitType: "stop-loss",
    });
    expect(typeof journal[0].reasoning).toBe("string");
  });

  it("momentum-trader flip-flop guard blocks re-entry into recently exited coin", () => {
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
      [keyOf(["explore", "--sort", "volume", "--limit", "12", "--json"])]: {
        coins: [hyper],
      },
      [keyOf(["explore", "--sort", "trending", "--limit", "12", "--json"])]: {
        coins: [hyper],
      },
    });

    harness.writeSkillState("momentum-trader", {
      updatedAt: "2026-03-22T12:00:00.000Z",
      lastTradeAt: null,
      spendWindowStartedAt: "2026-03-22T12:00:00.000Z",
      spentWindowEth: 0,
      positions: {},
      recentExits: {
        [hyper.address.toLowerCase()]: {
          exitedAt: "2026-03-22T12:00:00.000Z",
          runNumber: 4,
        },
      },
      runCount: 5,
    });

    const result = harness.runSkill("momentum-trader", {
      ZORA_MOMENTUM_LIVE: "false",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("flip-flop guard");
    expect(result.stdout).toContain(
      "No candidate cleared the gain, volume, and quote filters",
    );
    expect(result.stdout).not.toContain("Action:");
  });

  it("copy-trader stays in dry-run mode and journals confirmed source buys", async () => {
    const sourceWallet = "0x7000000000000000000000000000000000000001";
    const coinAddress = "0x7000000000000000000000000000000000000002";
    const recentSwapAt = minutesAgo(1);

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "HYPERPOP",
          estimated: { amount: "263", symbol: "HYPERPOP" },
          slippage: 1.2,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 84,
            balanceUsd: 84,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_buy_1",
            senderAddress: sourceWallet,
            transactionHash: "0xcopybuy1",
            blockTimestamp: recentSwapAt,
            activityType: "BUY",
            coinAmount: "263",
            quoteAmount: 84,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: dry-run");
    expect(result.stdout).toContain("Health: healthy");
    expect(result.stdout).toContain(
      "BUY hyperpop from jacob, source age 1m, source $84.00, planned copy $25.00",
    );
    expect(result.stdout).toContain("Action: dry-run only, no order sent");

    const journal = harness.readJournal("copy-trader");
    expect(journal).toHaveLength(1);
    expect(journal[0]).toMatchObject({
      action: "buy-quote",
      liveRequested: false,
      sourceDisplayName: "jacob",
      coinAddress,
      plannedFollowerDeltaUsd: 25,
      confirmed: true,
    });

    const state = harness.readSkillState("copy-trader");
    expect(state.watchedWallets[sourceWallet.toLowerCase()].displayName).toBe(
      "jacob",
    );

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("copy-trader can execute a live copied buy", async () => {
    const sourceWallet = "0x7100000000000000000000000000000000000001";
    const coinAddress = "0x7100000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "HYPERPOP",
          estimated: { amount: "263", symbol: "HYPERPOP" },
          slippage: 1.4,
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--slippage",
          "3",
          "--json",
          "--yes",
        ])]: {
          action: "buy",
          coin: "HYPERPOP",
          bought: { amount: "262", symbol: "HYPERPOP" },
          tx: "0xcopylivebuy",
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_live",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 100,
            balanceUsd: 90,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_buy_live",
            senderAddress: sourceWallet,
            transactionHash: "0xcopylive",
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "262",
            quoteAmount: 90,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: live");
    expect(result.stdout).toContain("Action: live buy sent, tx 0xcopylivebuy");

    const state = harness.readSkillState("copy-trader");
    expect(state.copiedPositions[coinAddress.toLowerCase()].sources[sourceWallet])
      .toMatchObject({
        active: true,
        followerCostUsd: 25,
        sourceLastTxHash: "0xcopylive",
      });
    expect(state.processedActions["0xcopylive:0x7100000000000000000000000000000000000001:0x7100000000000000000000000000000000000002:BUY"]).toMatchObject(
      {
        txHash: "0xcopylive",
        action: "entry",
      },
    );
  });

  it("copy-trader reports stale confirmed entries but skips them in live mode", async () => {
    const sourceWallet = "0x7110000000000000000000000000000000000001";
    const coinAddress = "0x7110000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "HYPERPOP",
          estimated: { amount: "250", symbol: "HYPERPOP" },
          slippage: 1.2,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_stale_entry",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 90,
            balanceUsd: 90,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_stale_entry",
            senderAddress: sourceWallet,
            transactionHash: "0xstaleentry",
            blockTimestamp: minutesAgo(4),
            activityType: "BUY",
            coinAmount: "250",
            quoteAmount: 90,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: live");
    expect(result.stdout).toContain("stale entry, live mode skipped");

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("copy-trader skips live buys when the current quote drifts too far from the source", async () => {
    const sourceWallet = "0x7120000000000000000000000000000000000001";
    const coinAddress = "0x7120000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "HYPERPOP",
          estimated: { amount: "40", symbol: "HYPERPOP" },
          slippage: 1.1,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_drift",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 100,
            balanceUsd: 50,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_drift",
            senderAddress: sourceWallet,
            transactionHash: "0xdrift",
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "100",
            quoteAmount: 50,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("above 8.0% drift gate");

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("copy-trader mirrors a live trim proportionally from the copied subposition only", async () => {
    const sourceWallet = "0x7200000000000000000000000000000000000001";
    const coinAddress = "0x7200000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [
            {
              name: "hyperpop",
              address: coinAddress,
              symbol: "HYPERPOP",
              balance: "100",
              usdValue: 100,
              priceUsd: "1",
            },
          ],
        },
        [keyOf([
          "sell",
          coinAddress,
          "--percent",
          "30",
          "--to",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          sold: { amount: "30", symbol: "HYPERPOP" },
          received: { amount: "0.012", symbol: "ETH" },
          slippage: 1.1,
        },
        [keyOf([
          "sell",
          coinAddress,
          "--percent",
          "30",
          "--to",
          "eth",
          "--slippage",
          "3",
          "--json",
          "--yes",
        ])]: {
          action: "sell",
          sold: { amount: "30", symbol: "HYPERPOP" },
          received: { amount: "0.012", symbol: "ETH" },
          tx: "0xcopytrim",
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_trim",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 50,
            balanceUsd: 50,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_sell_trim",
            recipientAddress: sourceWallet,
            transactionHash: "0xtrimtx",
            blockTimestamp: minutesAgo(2),
            activityType: "SELL",
            coinAmount: "50",
            quoteAmount: 50,
          },
        ]),
      },
    );

    harness.writeSkillState("copy-trader", {
      version: 2,
      updatedAt: "2026-03-27T12:00:00.000Z",
      lastHealthyAt: "2026-03-27T12:00:00.000Z",
      lastTradeAt: null,
      mode: "dry-run",
      spendWindowStartedAt: "2026-03-27T12:00:00.000Z",
      spentWindowUsd: 25,
      health: "healthy",
      reconcileNotes: [],
      watchedWallets: {
        [sourceWallet.toLowerCase()]: {
          sourceType: "manual",
          identifier: "jacob",
          walletAddress: sourceWallet,
          displayName: "jacob",
          profileId: "profile_jacob_trim",
          positions: {
            [coinAddress.toLowerCase()]: {
              address: coinAddress,
              name: "hyperpop",
              symbol: "HYPERPOP",
              balance: 100,
              balanceUsd: 100,
            },
          },
        },
      },
      copiedPositions: {
        [coinAddress.toLowerCase()]: {
          address: coinAddress,
          name: "hyperpop",
          symbol: "HYPERPOP",
          sources: {
            [sourceWallet]: {
              followerUnits: 60,
              followerCostUsd: 25,
              sourceBalance: 100,
              sourceBalanceUsd: 100,
              sourceLastActionAt: "2026-03-27T12:05:00.000Z",
              sourceLastTxHash: "0xoldtx",
              active: true,
            },
          },
        },
      },
      processedActions: {},
    });

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("planned trim 30.0%");
    expect(result.stdout).toContain("Action: live sell sent, tx 0xcopytrim");

    const state = harness.readSkillState("copy-trader");
    expect(
      state.copiedPositions[coinAddress.toLowerCase()].sources[sourceWallet],
    ).toMatchObject({
      followerUnits: 30,
      followerCostUsd: 12.5,
      sourceLastTxHash: "0xtrimtx",
      active: true,
    });
  });

  it("copy-trader can still execute an older exit inside the exit freshness window", async () => {
    const sourceWallet = "0x7210000000000000000000000000000000000001";
    const coinAddress = "0x7210000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [
            {
              name: "hyperpop",
              address: coinAddress,
              symbol: "HYPERPOP",
              balance: "100",
              usdValue: 100,
              priceUsd: "1",
            },
          ],
        },
        [keyOf([
          "sell",
          coinAddress,
          "--percent",
          "60",
          "--to",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          sold: { amount: "60", symbol: "HYPERPOP" },
          received: { amount: "0.024", symbol: "ETH" },
          slippage: 1.2,
        },
        [keyOf([
          "sell",
          coinAddress,
          "--percent",
          "60",
          "--to",
          "eth",
          "--slippage",
          "3",
          "--json",
          "--yes",
        ])]: {
          action: "sell",
          sold: { amount: "60", symbol: "HYPERPOP" },
          received: { amount: "0.024", symbol: "ETH" },
          tx: "0xexitwithinwindow",
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_exit_window",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_exit_window",
            recipientAddress: sourceWallet,
            transactionHash: "0xexitwindow",
            blockTimestamp: minutesAgo(8),
            activityType: "SELL",
            coinAmount: "100",
            quoteAmount: 100,
          },
        ]),
      },
    );

    harness.writeSkillState("copy-trader", {
      version: 2,
      updatedAt: "2026-03-27T12:00:00.000Z",
      lastHealthyAt: "2026-03-27T12:00:00.000Z",
      lastTradeAt: null,
      mode: "live",
      spendWindowStartedAt: "2026-03-27T12:00:00.000Z",
      spentWindowUsd: 25,
      health: "healthy",
      reconcileNotes: [],
      watchedWallets: {
        [sourceWallet.toLowerCase()]: {
          sourceType: "manual",
          identifier: "jacob",
          walletAddress: sourceWallet,
          displayName: "jacob",
          profileId: "profile_jacob_exit_window",
          positions: {
            [coinAddress.toLowerCase()]: {
              address: coinAddress,
              name: "hyperpop",
              symbol: "HYPERPOP",
              balance: 100,
              balanceUsd: 100,
            },
          },
        },
      },
      copiedPositions: {
        [coinAddress.toLowerCase()]: {
          address: coinAddress,
          name: "hyperpop",
          symbol: "HYPERPOP",
          sources: {
            [sourceWallet]: {
              followerUnits: 60,
              followerCostUsd: 25,
              sourceBalance: 100,
              sourceBalanceUsd: 100,
              sourceLastActionAt: "2026-03-27T12:05:00.000Z",
              sourceLastTxHash: "0xoldtx",
              active: true,
            },
          },
        },
      },
      processedActions: {},
    });

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("source age 8m");
    expect(result.stdout).toContain("Action: live sell sent, tx 0xexitwithinwindow");
  });

  it("copy-trader skips exits that fall outside the exit freshness window", async () => {
    const sourceWallet = "0x7220000000000000000000000000000000000001";
    const coinAddress = "0x7220000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [
            {
              name: "hyperpop",
              address: coinAddress,
              symbol: "HYPERPOP",
              balance: "100",
              usdValue: 100,
              priceUsd: "1",
            },
          ],
        },
        [keyOf([
          "sell",
          coinAddress,
          "--percent",
          "60",
          "--to",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          sold: { amount: "60", symbol: "HYPERPOP" },
          received: { amount: "0.024", symbol: "ETH" },
          slippage: 1.2,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_old_exit",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_old_exit",
            recipientAddress: sourceWallet,
            transactionHash: "0xoldexit",
            blockTimestamp: minutesAgo(15),
            activityType: "SELL",
            coinAmount: "100",
            quoteAmount: 100,
          },
        ]),
      },
    );

    harness.writeSkillState("copy-trader", {
      version: 2,
      updatedAt: "2026-03-27T12:00:00.000Z",
      lastHealthyAt: "2026-03-27T12:00:00.000Z",
      lastTradeAt: null,
      mode: "live",
      spendWindowStartedAt: "2026-03-27T12:00:00.000Z",
      spentWindowUsd: 25,
      health: "healthy",
      reconcileNotes: [],
      watchedWallets: {
        [sourceWallet.toLowerCase()]: {
          sourceType: "manual",
          identifier: "jacob",
          walletAddress: sourceWallet,
          displayName: "jacob",
          profileId: "profile_jacob_old_exit",
          positions: {
            [coinAddress.toLowerCase()]: {
              address: coinAddress,
              name: "hyperpop",
              symbol: "HYPERPOP",
              balance: 100,
              balanceUsd: 100,
            },
          },
        },
      },
      copiedPositions: {
        [coinAddress.toLowerCase()]: {
          address: coinAddress,
          name: "hyperpop",
          symbol: "HYPERPOP",
          sources: {
            [sourceWallet]: {
              followerUnits: 60,
              followerCostUsd: 25,
              sourceBalance: 100,
              sourceBalanceUsd: 100,
              sourceLastActionAt: "2026-03-27T12:05:00.000Z",
              sourceLastTxHash: "0xoldtx",
              active: true,
            },
          },
        },
      },
      processedActions: {},
    });

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("stale exit, live mode skipped");

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("copy-trader skips duplicate confirmed actions without replaying them", async () => {
    const sourceWallet = "0x7300000000000000000000000000000000000001";
    const coinAddress = "0x7300000000000000000000000000000000000002";
    const txHash = "0xduplicatecopy";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_duplicate",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 90,
            balanceUsd: 90,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_duplicate",
            senderAddress: sourceWallet,
            transactionHash: txHash,
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "90",
            quoteAmount: 90,
          },
        ]),
      },
    );

    harness.writeSkillState("copy-trader", {
      version: 2,
      updatedAt: null,
      lastHealthyAt: null,
      lastTradeAt: null,
      mode: "dry-run",
      spendWindowStartedAt: null,
      spentWindowUsd: 0,
      health: "healthy",
      reconcileNotes: [],
      watchedWallets: {},
      copiedPositions: {},
      processedActions: {
        [`${txHash}:${sourceWallet.toLowerCase()}:${coinAddress.toLowerCase()}:BUY`]: {
          seenAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          txHash,
          sourceWallet,
          coinAddress,
          action: "entry",
        },
      },
    });

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("duplicate action already processed");
    expect(harness.readLog()).toHaveLength(1);
  });

  it("copy-trader reports snapshot deltas without recent swap confirmation and skips live execution", async () => {
    const sourceWallet = "0x7400000000000000000000000000000000000001";
    const coinAddress = "0x7400000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_unconfirmed",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 80,
            balanceUsd: 80,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("snapshot change without matching swap");
    expect(harness.readLog()).toHaveLength(1);
  });

  it("copy-trader skips entries into follower coins that were not opened by the skill", async () => {
    const sourceWallet = "0x7500000000000000000000000000000000000001";
    const coinAddress = "0x7500000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [
            {
              name: "hyperpop",
              address: coinAddress,
              symbol: "HYPERPOP",
              balance: "12",
              usdValue: 12,
              priceUsd: "1",
            },
          ],
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_existing",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 80,
            balanceUsd: 80,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_existing",
            senderAddress: sourceWallet,
            transactionHash: "0xexistingtx",
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "80",
            quoteAmount: 80,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
    });

    assertSuccess(result);
    expect(result.stdout).toContain(
      "existing follower exposure not opened by copy-trader",
    );
  });

  it("copy-trader forces dry-run when the local state is corrupted", async () => {
    const sourceWallet = "0x7510000000000000000000000000000000000001";
    const coinAddress = "0x7510000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          coinAddress,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "HYPERPOP",
          estimated: { amount: "263", symbol: "HYPERPOP" },
          slippage: 1.2,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_corrupt",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: coinAddress,
            name: "hyperpop",
            symbol: "HYPERPOP",
            balance: 84,
            balanceUsd: 84,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: coinAddress,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_corrupt",
            senderAddress: sourceWallet,
            transactionHash: "0xcorrupt",
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "263",
            quoteAmount: 84,
          },
        ]),
      },
    );

    const skillDir = path.join(
      harness.homeDir,
      ".config",
      "zora-agent-skills",
      "copy-trader",
    );
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, "state.json"), "{not-json");

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Mode: dry-run");
    expect(result.stdout).toContain(
      "state recovered from corruption, dry-run forced this cycle",
    );
    expect(result.stdout).toContain("Action: dry-run only, no order sent");

    const files = readdirSync(skillDir);
    expect(files.some((file) => file.startsWith("state.corrupt."))).toBe(true);
  });

  it("copy-trader blocks new live entries when reconciliation finds a severe mismatch", async () => {
    const sourceWallet = "0x7520000000000000000000000000000000000001";
    const trackedCoin = "0x7520000000000000000000000000000000000002";
    const candidateCoin = "0x7520000000000000000000000000000000000003";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
        [keyOf([
          "buy",
          candidateCoin,
          "--usd",
          "25",
          "--token",
          "eth",
          "--quote",
          "--json",
        ])]: {
          action: "quote",
          coin: "FRESH",
          estimated: { amount: "200", symbol: "FRESH" },
          slippage: 1.3,
        },
      },
      {
        [keyOfRequest("/profile", { identifier: "jacob" })]: createProfileResponse({
          id: "profile_jacob_reconcile",
          handle: "jacob",
          walletAddress: sourceWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: sourceWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([
          {
            address: candidateCoin,
            name: "fresh coin",
            symbol: "FRESH",
            balance: 100,
            balanceUsd: 100,
          },
        ]),
        [keyOfRequest("/coinSwaps", {
          address: candidateCoin,
          chain: 8453,
          first: 20,
        })]: createCoinSwapsResponse([
          {
            id: "swap_reconcile",
            senderAddress: sourceWallet,
            transactionHash: "0xreconcile",
            blockTimestamp: minutesAgo(1),
            activityType: "BUY",
            coinAmount: "200",
            quoteAmount: 100,
          },
        ]),
      },
    );

    harness.writeSkillState("copy-trader", {
      version: 2,
      updatedAt: "2026-03-27T12:00:00.000Z",
      lastHealthyAt: "2026-03-27T12:00:00.000Z",
      lastTradeAt: null,
      mode: "live",
      spendWindowStartedAt: "2026-03-27T12:00:00.000Z",
      spentWindowUsd: 25,
      health: "healthy",
      reconcileNotes: [],
      watchedWallets: {},
      copiedPositions: {
        [trackedCoin.toLowerCase()]: {
          address: trackedCoin,
          name: "orphaned coin",
          symbol: "ORPHAN",
          sources: {
            [sourceWallet]: {
              followerUnits: 60,
              followerCostUsd: 25,
              sourceBalance: 60,
              sourceBalanceUsd: 60,
              sourceLastActionAt: "2026-03-27T12:05:00.000Z",
              sourceLastTxHash: "0xoldtx",
              active: true,
            },
          },
        },
      },
      processedActions: {},
    });

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: "jacob",
      ZORA_COPYTRADE_LIVE: "true",
    });

    assertSuccess(result);
    expect(result.stdout).toContain(
      "orphaned coin: follower wallet no longer holds this copied coin",
    );
    expect(result.stdout).toContain(
      "reconciliation mismatch detected, new live entries blocked this cycle",
    );

    const commands = harness.readLog().map((entry) => entry.args.join(" "));
    expect(commands.some((command) => command.includes("--yes"))).toBe(false);
  });

  it("copy-trader can import leaderboard handles and resolve them through the public profile endpoint", async () => {
    const manualWallet = "0x7600000000000000000000000000000000000001";
    const leaderboardWallet = "0x7600000000000000000000000000000000000002";

    const harness = await createHarnessWithPublicApi(
      {
        [keyOf(["balance", "--json"])]: {
          wallet: [
            { symbol: "ETH", balance: "0.20", usdValue: 500, priceUsd: 2500 },
          ],
          coins: [],
        },
      },
      {
        [keyOfRequest("/profile", { identifier: manualWallet })]: createProfileResponse({
          id: "profile_manual",
          handle: "manual-source",
          walletAddress: manualWallet,
        }),
        [keyOfRequest("/profile", { identifier: "reef-X4B2" })]: createProfileResponse({
          id: "profile_leaderboard",
          handle: "reef-X4B2",
          walletAddress: leaderboardWallet,
        }),
        [keyOfRequest("/profileBalances", {
          identifier: manualWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([]),
        [keyOfRequest("/profileBalances", {
          identifier: leaderboardWallet,
          count: 50,
          sortOption: "MARKET_VALUE_USD",
          excludeHidden: true,
          chainIds: 8453,
        })]: createProfileBalancesResponse([]),
        [keyOfRequest("/traderLeaderboard", { first: 1 })]: createTraderLeaderboardResponse([
          {
            handle: "reef-X4B2",
            profileId: "profile_leaderboard",
            score: 98,
            weekVolumeUsd: 42000,
          },
        ]),
      },
    );

    const result = await harness.runSkill("copy-trader", {
      ZORA_COPYTRADE_SOURCE_ADDRESSES: manualWallet,
      ZORA_COPYTRADE_IMPORT_LEADERBOARD: "true",
      ZORA_COPYTRADE_LEADERBOARD_COUNT: "1",
    });

    assertSuccess(result);
    expect(result.stdout).toContain("Sources tracked: 2");
    expect(result.stdout).toContain("- manual-source, manual");
    expect(result.stdout).toContain("- reef-X4B2, leaderboard");
    expect(harness.readPublicLog()).toContain(
      keyOfRequest("/traderLeaderboard", { first: 1 }),
    );
  });
});
