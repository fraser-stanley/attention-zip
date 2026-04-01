#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SKILL_ID = "trend-scout";
const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");

const LIMIT = readNumber("ZORA_TREND_LIMIT", 8, { min: 1, max: 20 });
const MIN_VOLUME_USD = readNumber("ZORA_TREND_MIN_VOLUME_USD", 0, { min: 0 });
const WATCHLIST = readCsv("ZORA_TREND_WATCHLIST");

const SORTS = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "volume", label: "Volume" },
  { key: "mcap", label: "Market cap" },
];

function readNumber(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readCsv(name) {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function computeChangePercent(coin) {
  const marketCap = Number(coin.marketCap || 0);
  const delta = Number(coin.marketCapDelta24h || 0);
  if (!marketCap || marketCap === delta) return 0;
  return (delta / (marketCap - delta)) * 100;
}

function formatPct(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
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
    return { updatedAt: null, snapshots: {} };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function filterCoins(coins) {
  return coins.filter((coin) => Number(coin.volume24h || 0) >= MIN_VOLUME_USD);
}

function findWatchlistHits(resultMap) {
  if (WATCHLIST.length === 0) return [];

  const seen = new Map();
  for (const coins of Object.values(resultMap)) {
    for (const coin of coins) {
      const id = coinId(coin);
      if (!seen.has(id)) {
        seen.set(id, coin);
      }
      if (coin.name) {
        seen.set(coin.name.toLowerCase(), coin);
      }
    }
  }

  return WATCHLIST.map((entry) => seen.get(entry.toLowerCase())).filter(
    Boolean,
  );
}

async function main() {
  const previous = await loadState();

  const resultPairs = await Promise.all(
    SORTS.map(async ({ key }) => {
      const payload = await runZora([
        "explore",
        "--sort",
        key,
        "--type",
        "trend",
        "--limit",
        String(LIMIT),
        "--json",
      ]);
      return [key, filterCoins(payload.coins ?? [])];
    }),
  );

  const resultMap = Object.fromEntries(resultPairs);
  const runAt = new Date().toISOString();
  const trending = resultMap.trending ?? [];
  const watchlistHits = findWatchlistHits(resultMap);

  console.log("Trend Scout");
  console.log(`Run at ${runAt}`);
  console.log("");

  if (trending.length === 0) {
    console.log("No trend coins met the current filters.");
  } else {
    console.log("Trending leaders:");
    for (const [index, coin] of trending.slice(0, 3).entries()) {
      console.log(
        `${index + 1}. ${coin.name}, ${formatUsd(coin.marketCap)}, ${formatPct(computeChangePercent(coin))}, ${formatUsd(coin.volume24h)} volume`,
      );
    }
  }

  console.log("");
  console.log("New entrants since the last run:");
  let entrantCount = 0;
  for (const { key, label } of SORTS) {
    const previousIds = new Set(previous.snapshots?.[key] ?? []);
    const entrants = (resultMap[key] ?? [])
      .filter((coin) => !previousIds.has(coinId(coin)))
      .slice(0, 2);

    if (entrants.length === 0) {
      continue;
    }

    entrantCount += entrants.length;
    for (const coin of entrants) {
      console.log(`- ${coin.name} entered the ${label.toLowerCase()} view`);
    }
  }
  if (entrantCount === 0) {
    console.log("- No new entrants");
  }

  console.log("");
  console.log("Watchlist:");
  if (watchlistHits.length === 0) {
    console.log("- No watchlist matches");
  } else {
    for (const coin of watchlistHits) {
      console.log(`- ${coin.name} is live in the current trend scan`);
    }
  }

  await saveState({
    updatedAt: runAt,
    snapshots: Object.fromEntries(
      SORTS.map(({ key }) => [key, (resultMap[key] ?? []).map(coinId)]),
    ),
  });

  console.log("");
  console.log(`Saved snapshot to ${STATE_FILE}`);
}

main().catch((error) => {
  console.error(`Trend Scout failed: ${error.message}`);
  process.exit(1);
});
