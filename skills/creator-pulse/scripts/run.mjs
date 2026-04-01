#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SKILL_ID = "creator-pulse";
const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");

const LIMIT = readNumber("ZORA_CREATOR_LIMIT", 8, { min: 1, max: 20 });
const WATCHLIST = readCsv("ZORA_CREATOR_WATCHLIST");
const MIN_VOLUME_USD = readNumber("ZORA_CREATOR_MIN_VOLUME_USD", 0, { min: 0 });

const VIEWS = [
  { key: "featured", label: "Featured" },
  { key: "trending", label: "Trending" },
  { key: "volume", label: "Volume" },
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

function computePct(current, previous) {
  if (!previous) return null;
  if (!current && !previous) return 0;
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function creatorId(coin) {
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
    return { updatedAt: null, featured: [], watchlist: {} };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function filterCoins(coins) {
  return coins.filter((coin) => Number(coin.volume24h || 0) >= MIN_VOLUME_USD);
}

async function fetchWatchlist() {
  const results = [];
  for (const entry of WATCHLIST) {
    const payload = await runZora([
      "get",
      entry,
      "--type",
      "creator-coin",
      "--json",
    ]);
    if (!payload.error) {
      results.push(payload);
    }
  }
  return results;
}

async function main() {
  const previous = await loadState();
  const runAt = new Date().toISOString();

  const viewPairs = await Promise.all(
    VIEWS.map(async ({ key }) => {
      const payload = await runZora([
        "explore",
        "--sort",
        key,
        "--type",
        "creator-coin",
        "--limit",
        String(LIMIT),
        "--json",
      ]);
      return [key, filterCoins(payload.coins ?? [])];
    }),
  );

  const views = Object.fromEntries(viewPairs);
  const watchlistCoins = await fetchWatchlist();

  console.log("Creator Pulse");
  console.log(`Run at ${runAt}`);
  console.log("");

  console.log("Featured creators:");
  const featured = views.featured ?? [];
  if (featured.length === 0) {
    console.log("- No featured creators met the current filters");
  } else {
    for (const [index, coin] of featured.slice(0, 3).entries()) {
      console.log(
        `${index + 1}. ${coin.name}, ${formatUsd(coin.marketCap)}, ${formatUsd(coin.volume24h)} volume, ${coin.uniqueHolders ?? 0} holders`,
      );
    }
  }

  console.log("");
  console.log("Watchlist alerts:");
  if (watchlistCoins.length === 0) {
    console.log("- No watchlist configured");
  } else {
    let alertCount = 0;
    for (const coin of watchlistCoins) {
      const prior = previous.watchlist?.[creatorId(coin)] ?? null;
      const currentVolume = Number(coin.volume24h || 0);
      const currentHolders = Number(coin.uniqueHolders || 0);
      const volumePct = computePct(
        currentVolume,
        Number(prior?.volume24h || 0),
      );
      const holderDelta = prior
        ? currentHolders - Number(prior.uniqueHolders || 0)
        : null;

      if (volumePct !== null && Math.abs(volumePct) >= 10) {
        alertCount += 1;
        const sign = volumePct >= 0 ? "+" : "";
        console.log(
          `- ${coin.name} volume moved ${sign}${volumePct.toFixed(1)}% since the last run`,
        );
      }

      if (holderDelta !== null && Math.abs(holderDelta) >= 25) {
        alertCount += 1;
        const sign = holderDelta >= 0 ? "+" : "";
        console.log(`- ${coin.name} holder count moved ${sign}${holderDelta}`);
      }

      if (!prior) {
        alertCount += 1;
        console.log(`- ${coin.name} is new to the stored watchlist state`);
      }
    }

    const previousFeatured = new Set(previous.featured ?? []);
    for (const coin of featured) {
      if (!previousFeatured.has(creatorId(coin))) {
        alertCount += 1;
        console.log(`- ${coin.name} entered the featured creator view`);
      }
    }

    if (alertCount === 0) {
      console.log("- No watchlist changes cleared the alert threshold");
    }
  }

  await saveState({
    updatedAt: runAt,
    featured: featured.map(creatorId),
    watchlist: Object.fromEntries(
      watchlistCoins.map((coin) => [
        creatorId(coin),
        {
          name: coin.name,
          volume24h: Number(coin.volume24h || 0),
          uniqueHolders: Number(coin.uniqueHolders || 0),
        },
      ]),
    ),
  });

  console.log("");
  console.log(`Saved snapshot to ${STATE_FILE}`);
}

main().catch((error) => {
  console.error(`Creator Pulse failed: ${error.message}`);
  process.exit(1);
});
