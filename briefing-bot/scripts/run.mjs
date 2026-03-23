#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SKILL_ID = "briefing-bot";
const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");

const LIMIT = readNumber("ZORA_BRIEFING_LIMIT", 5, { min: 1, max: 20 });
const INCLUDE_PORTFOLIO = readBoolean("ZORA_BRIEFING_INCLUDE_PORTFOLIO", true);

const SCANS = ["trending", "volume", "new", "gainers"];

function readNumber(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readBoolean(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
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

async function runZora(args, { allowFailure = false } = {}) {
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
        if (payload?.error && allowFailure) {
          return null;
        }
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
    if (allowFailure) return null;
    const stderr = error.stderr?.toString().trim();
    throw new Error(stderr || error.message);
  }
}

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch {
    return { updatedAt: null, scans: {} };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  const previous = await loadState();
  const runAt = new Date().toISOString();

  const scanPairs = await Promise.all(
    SCANS.map(async (sort) => {
      const payload = await runZora([
        "explore",
        "--sort",
        sort,
        "--limit",
        String(LIMIT),
        "--json",
      ]);
      return [sort, payload.coins ?? []];
    }),
  );
  const scans = Object.fromEntries(scanPairs);

  const portfolio = INCLUDE_PORTFOLIO
    ? await runZora(["balance", "--json"], { allowFailure: true })
    : null;
  const heldIds = new Set((portfolio?.coins ?? []).map((coin) => coinId(coin)));
  const trending = scans.trending ?? [];
  const volume = scans.volume ?? [];
  const newest = scans.new ?? [];
  const gainers = scans.gainers ?? [];

  const newSinceLastRun = newest.filter((coin) => {
    const previousIds = new Set(previous.scans?.new ?? []);
    return !previousIds.has(coinId(coin));
  });

  const overlap = [...trending, ...volume, ...gainers]
    .filter((coin) => heldIds.has(coinId(coin)))
    .slice(0, 3);

  console.log("Zora Briefing");
  console.log(`Run at ${runAt}`);
  console.log("");

  if (trending[0]) {
    console.log(
      `Trending: ${trending[0].name} leads at ${formatUsd(trending[0].marketCap)}, ${formatPct(computeChangePercent(trending[0]))}.`,
    );
  }
  if (volume[0]) {
    console.log(
      `Volume: ${volume[0].name} leads at ${formatUsd(volume[0].volume24h)} volume.`,
    );
  }
  console.log(
    `New: ${newSinceLastRun.length} fresh launches since the last run${newSinceLastRun[0] ? `, largest is ${newSinceLastRun[0].name} at ${formatUsd(newSinceLastRun[0].marketCap)}.` : "."}`,
  );
  if (gainers[0]) {
    console.log(
      `Gainers: ${gainers[0].name} leads at ${formatPct(computeChangePercent(gainers[0]))}.`,
    );
  }

  console.log("");
  console.log("Portfolio overlap:");
  if (!portfolio) {
    console.log("- Portfolio scan skipped, no wallet was available");
  } else if (overlap.length === 0) {
    console.log("- No held coins are in the top market scans");
  } else {
    for (const coin of overlap) {
      console.log(`- ${coin.name} is both held and active in the market scans`);
    }
  }

  const assessment =
    gainers.length > 0 && computeChangePercent(gainers[0]) >= 20
      ? "Active tape. Momentum is broad enough to watch closely."
      : "Calmer tape. Most movement is concentrated in a small set of coins.";

  console.log("");
  console.log(`Assessment: ${assessment}`);

  await saveState({
    updatedAt: runAt,
    scans: Object.fromEntries(
      Object.entries(scans).map(([sort, coins]) => [sort, coins.map(coinId)]),
    ),
  });
}

main().catch((error) => {
  console.error(`Briefing Bot failed: ${error.message}`);
  process.exit(1);
});
