#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SKILL_ID = "portfolio-scout";
const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");

const LIMIT = readNumber("ZORA_PORTFOLIO_LIMIT", 20, { min: 1, max: 20 });
const CONCENTRATION_THRESHOLD = readNumber(
  "ZORA_PORTFOLIO_CONCENTRATION_ALERT_PCT",
  35,
  { min: 1, max: 100 },
);
const DRAWDOWN_THRESHOLD = readNumber(
  "ZORA_PORTFOLIO_DRAWNDOWN_ALERT_PCT",
  15,
  { min: 1, max: 100 },
);

function readNumber(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function coinId(coin) {
  return (coin.address || coin.name || "unknown").toLowerCase();
}

async function runZora(args) {
  try {
    const { stdout } = await execFileAsync("zora", args, {
      maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout.trim());
  } catch (error) {
    const stdout = error.stdout?.toString().trim();
    if (stdout) {
      try {
        const payload = JSON.parse(stdout);
        if (payload?.error) {
          throw new Error(
            payload.suggestion
              ? `${payload.error} (${payload.suggestion})`
              : payload.error,
          );
        }
      } catch {
        // ignore parse errors and fall through
      }
    }
    const stderr = error.stderr?.toString().trim();
    throw new Error(stderr || error.message);
  }
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return { updatedAt: null, totalValue: 0, positions: {} };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  const previous = await loadState();
  const runAt = new Date().toISOString();
  const portfolio = await runZora(["balance", "--json"]);

  const wallet = portfolio.wallet ?? [];
  const coins = (portfolio.coins ?? []).slice(0, LIMIT);
  const totalValue = coins.reduce(
    (sum, coin) => sum + Number(coin.usdValue || 0),
    0,
  );
  const previousTotal = Number(previous.totalValue || 0);
  const drawdownPct =
    previousTotal > 0
      ? ((previousTotal - totalValue) / previousTotal) * 100
      : 0;

  const currentIds = new Set(coins.map(coinId));
  const previousIds = new Set(Object.keys(previous.positions ?? {}));
  const newPositions = coins.filter((coin) => !previousIds.has(coinId(coin)));
  const closedPositions = [...previousIds].filter((id) => !currentIds.has(id));
  const concentration = coins
    .map((coin) => ({
      coin,
      pct: totalValue > 0 ? (Number(coin.usdValue || 0) / totalValue) * 100 : 0,
    }))
    .sort((left, right) => right.pct - left.pct);

  console.log("Portfolio Scout");
  console.log(`Run at ${runAt}`);
  console.log("");

  console.log("Spendable:");
  if (wallet.length === 0) {
    console.log("- No spendable balance data returned");
  } else {
    for (const asset of wallet) {
      console.log(`- ${asset.balance} ${asset.symbol}`);
    }
  }

  console.log("");
  console.log("Coin positions:");
  if (coins.length === 0) {
    console.log("- No coin positions found");
  } else {
    for (const [index, coin] of coins.slice(0, 3).entries()) {
      const pct =
        totalValue > 0 ? (Number(coin.usdValue || 0) / totalValue) * 100 : 0;
      console.log(
        `${index + 1}. ${coin.name}, ${formatUsd(coin.usdValue)}, ${pct.toFixed(1)}% of tracked coin value`,
      );
    }
  }

  console.log("");
  console.log("Alerts:");
  let alertCount = 0;
  if (concentration[0] && concentration[0].pct >= CONCENTRATION_THRESHOLD) {
    alertCount += 1;
    console.log(
      `- Concentration warning: ${concentration[0].coin.name} is above the ${CONCENTRATION_THRESHOLD}% threshold`,
    );
  }
  if (previousTotal > 0 && drawdownPct >= DRAWDOWN_THRESHOLD) {
    alertCount += 1;
    console.log(`- Run-to-run drawdown is ${drawdownPct.toFixed(1)}%`);
  }
  for (const coin of newPositions.slice(0, 3)) {
    alertCount += 1;
    console.log(`- ${coin.name} is a new position since the last run`);
  }
  for (const id of closedPositions.slice(0, 3)) {
    alertCount += 1;
    const name = previous.positions[id]?.name ?? id;
    console.log(`- ${name} is no longer held`);
  }
  if (alertCount === 0) {
    console.log("- No portfolio alerts");
  }

  console.log("");
  console.log(`Tracked coin value: ${formatUsd(totalValue)}`);

  await saveState({
    updatedAt: runAt,
    totalValue,
    positions: Object.fromEntries(
      coins.map((coin) => [
        coinId(coin),
        {
          name: coin.name,
          usdValue: Number(coin.usdValue || 0),
        },
      ]),
    ),
  });
}

main().catch((error) => {
  console.error(`Portfolio Scout failed: ${error.message}`);
  process.exit(1);
});
