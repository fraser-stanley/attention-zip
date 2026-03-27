#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SKILL_ID = "momentum-trader";
const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");
const JOURNAL_FILE = path.join(STATE_DIR, "journal.jsonl");

const LIVE = readBoolean("ZORA_MOMENTUM_LIVE", false);
const LIMIT = readNumber("ZORA_MOMENTUM_LIMIT", 12, { min: 1, max: 20 });
const MAX_ETH = readNumber("ZORA_MOMENTUM_MAX_ETH", 0.01, {
  min: 0.001,
  max: 1,
});
const MAX_POSITIONS = readNumber("ZORA_MOMENTUM_MAX_POSITIONS", 3, {
  min: 1,
  max: 20,
});
const MIN_GAIN_PCT = readNumber("ZORA_MOMENTUM_MIN_GAIN_PCT", 15, {
  min: 1,
  max: 500,
});
const MIN_VOLUME_USD = readNumber("ZORA_MOMENTUM_MIN_VOLUME_USD", 50000, {
  min: 0,
});
const MAX_SLIPPAGE_PCT = readNumber("ZORA_MOMENTUM_MAX_SLIPPAGE_PCT", 3, {
  min: 0.1,
  max: 99,
});
const TRAILING_STOP_PCT = readNumber("ZORA_MOMENTUM_TRAILING_STOP", 15, {
  min: 1,
  max: 95,
});
const COOLDOWN_SEC = readNumber("ZORA_MOMENTUM_COOLDOWN_SEC", 300, {
  min: 0,
  max: 86400,
});
const DAILY_CAP_ETH = readNumber("ZORA_MOMENTUM_DAILY_CAP_ETH", 0.05, {
  min: 0.001,
  max: 10,
});

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
    maximumFractionDigits: Number(value || 0) < 1 ? 6 : 2,
  }).format(Number(value || 0));
}

function formatPct(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function computeChangePercent(coin) {
  const marketCap = Number(coin.marketCap || 0);
  const delta = Number(coin.marketCapDelta24h || 0);
  if (!marketCap || marketCap === delta) return 0;
  return (delta / (marketCap - delta)) * 100;
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
    return {
      updatedAt: null,
      lastTradeAt: null,
      spendWindowStartedAt: null,
      spentWindowEth: 0,
      positions: {},
    };
  }
}

async function saveState(state) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function appendJournal(entry) {
  await mkdir(STATE_DIR, { recursive: true });
  await appendFile(JOURNAL_FILE, `${JSON.stringify(entry)}\n`);
}

function resetSpendWindowIfNeeded(state, now) {
  if (!state.spendWindowStartedAt) {
    state.spendWindowStartedAt = now.toISOString();
    state.spentWindowEth = 0;
    return;
  }

  const startedAt = new Date(state.spendWindowStartedAt);
  if (now.getTime() - startedAt.getTime() >= 24 * 60 * 60 * 1000) {
    state.spendWindowStartedAt = now.toISOString();
    state.spentWindowEth = 0;
  }
}

function reconcileTrackedPositions(state, heldCoins) {
  const byId = new Map(heldCoins.map((coin) => [coinId(coin), coin]));
  const nextPositions = {};

  for (const [id, heldCoin] of byId.entries()) {
    const existing = state.positions?.[id] ?? {};
    const currentPriceUsd = Number(heldCoin.priceUsd || 0);
    const entryPriceUsd = existing.entryPriceUsd ?? (currentPriceUsd || null);
    const peakPriceUsd =
      Math.max(existing.peakPriceUsd ?? 0, currentPriceUsd || 0) || null;

    nextPositions[id] = {
      address: heldCoin.address,
      name: heldCoin.name,
      symbol: heldCoin.symbol,
      openedAt:
        existing.openedAt ?? state.updatedAt ?? new Date().toISOString(),
      balance: heldCoin.balance,
      entryPriceUsd,
      peakPriceUsd,
      lastPriceUsd: currentPriceUsd || null,
    };
  }

  state.positions = nextPositions;
}

function eligibleForExit(position) {
  if (
    !position.entryPriceUsd ||
    !position.peakPriceUsd ||
    !position.lastPriceUsd
  ) {
    return false;
  }
  return (
    position.lastPriceUsd <=
    position.peakPriceUsd * (1 - TRAILING_STOP_PCT / 100)
  );
}

async function quoteExit(position) {
  return runZora([
    "sell",
    position.address,
    "--percent",
    "100",
    "--to",
    "eth",
    "--quote",
    "--slippage",
    String(MAX_SLIPPAGE_PCT),
    "--json",
  ]);
}

async function executeExit(position) {
  return runZora([
    "sell",
    position.address,
    "--percent",
    "100",
    "--to",
    "eth",
    "--slippage",
    String(MAX_SLIPPAGE_PCT),
    "--json",
    "--yes",
  ]);
}

async function discoverCandidate(heldIds) {
  const [gainersPayload, trendingPayload] = await Promise.all([
    runZora([
      "explore",
      "--sort",
      "gainers",
      "--limit",
      String(LIMIT),
      "--json",
    ]),
    runZora([
      "explore",
      "--sort",
      "trending",
      "--limit",
      String(LIMIT),
      "--json",
    ]),
  ]);

  const merged = new Map();
  for (const coin of [
    ...(gainersPayload.coins ?? []),
    ...(trendingPayload.coins ?? []),
  ]) {
    merged.set(coinId(coin), coin);
  }

  for (const coin of merged.values()) {
    const changePct = computeChangePercent(coin);
    const volumeUsd = Number(coin.volume24h || 0);
    if (heldIds.has(coinId(coin))) continue;
    if (changePct < MIN_GAIN_PCT) continue;
    if (volumeUsd < MIN_VOLUME_USD) continue;

    const detail = await runZora(["get", coin.address, "--json"]);
    const quote = await runZora([
      "buy",
      coin.address,
      "--eth",
      String(MAX_ETH),
      "--quote",
      "--slippage",
      String(MAX_SLIPPAGE_PCT),
      "--json",
    ]);

    return { coin, detail, quote };
  }

  return null;
}

async function executeEntry(candidate) {
  return runZora([
    "buy",
    candidate.coin.address,
    "--eth",
    String(MAX_ETH),
    "--slippage",
    String(MAX_SLIPPAGE_PCT),
    "--json",
    "--yes",
  ]);
}

async function main() {
  const state = await loadState();
  const now = new Date();
  resetSpendWindowIfNeeded(state, now);

  const balancesPayload = await runZora([
    "balance",
    "coins",
    "--sort",
    "usd-value",
    "--limit",
    "20",
    "--json",
  ]);
  const heldCoins = balancesPayload.coins ?? [];
  reconcileTrackedPositions(state, heldCoins);
  const trackedPositions = Object.values(state.positions);

  console.log("Momentum Trader");
  console.log(`Run at ${now.toISOString()}`);
  console.log(`Mode: ${LIVE ? "live" : "dry-run"}`);
  console.log("");

  console.log(`Open positions tracked: ${trackedPositions.length}`);
  for (const position of trackedPositions.slice(0, 3)) {
    console.log(
      `- ${position.name}, entry ${formatUsd(position.entryPriceUsd)}, peak ${formatUsd(position.peakPriceUsd)}, current ${formatUsd(position.lastPriceUsd)}`,
    );
  }
  if (trackedPositions.length === 0) {
    console.log("- No tracked positions");
  }

  const exits = trackedPositions.filter(eligibleForExit);
  if (exits.length > 0) {
    console.log("");
    console.log("Exits:");
    for (const position of exits) {
      if (LIVE) {
        const result = await executeExit(position);
        console.log(`- Sold ${position.name}, tx ${result.tx}`);
        await appendJournal({
          timestamp: now.toISOString(),
          action: "sell",
          source: "zora:momentum-trader",
          live: true,
          address: position.address,
          symbol: position.symbol,
          tx: result.tx,
        });
        delete state.positions[coinId(position)];
        state.lastTradeAt = now.toISOString();
      } else {
        const quote = await quoteExit(position);
        console.log(
          `- Dry-run exit for ${position.name}, estimated ${quote.estimated.amount} ${quote.estimated.symbol}`,
        );
        await appendJournal({
          timestamp: now.toISOString(),
          action: "sell-quote",
          source: "zora:momentum-trader",
          live: false,
          address: position.address,
          symbol: position.symbol,
          estimated: quote.estimated.amount,
        });
      }
    }
  } else {
    console.log("");
    console.log("No exits fired.");
  }

  const cooldownRemaining =
    state.lastTradeAt == null
      ? 0
      : Math.max(
          0,
          COOLDOWN_SEC -
            Math.floor(
              (now.getTime() - new Date(state.lastTradeAt).getTime()) / 1000,
            ),
        );
  const trackedCount = Object.keys(state.positions).length;
  const heldIds = new Set(Object.keys(state.positions));

  if (cooldownRemaining > 0) {
    console.log("");
    console.log(
      `Entry scan skipped: cooldown active for ${cooldownRemaining}s.`,
    );
  } else if (trackedCount >= MAX_POSITIONS) {
    console.log("");
    console.log(
      `Entry scan skipped: already at the max position count (${MAX_POSITIONS}).`,
    );
  } else if (Number(state.spentWindowEth || 0) + MAX_ETH > DAILY_CAP_ETH) {
    console.log("");
    console.log(
      `Entry scan skipped: daily cap would be exceeded (${state.spentWindowEth}/${DAILY_CAP_ETH} ETH).`,
    );
  } else {
    const candidate = await discoverCandidate(heldIds);

    console.log("");
    console.log("Candidates:");
    if (!candidate) {
      console.log("- No candidate cleared the gain, volume, and quote filters");
    } else {
      const quote = candidate.quote;
      console.log(
        `1. ${candidate.coin.name}, ${formatPct(computeChangePercent(candidate.coin))}, ${formatUsd(candidate.coin.volume24h)} volume`,
      );
      console.log(
        `   Quote: ${MAX_ETH} ETH -> ${quote.estimated.amount} ${quote.estimated.symbol}, slippage ${quote.slippage}%`,
      );

      if (LIVE) {
        const result = await executeEntry(candidate);
        console.log(
          `   Action: bought ${candidate.coin.name}, tx ${result.tx}`,
        );
        state.positions[coinId(candidate.coin)] = {
          address: candidate.coin.address,
          name: candidate.coin.name,
          symbol: candidate.coin.symbol,
          openedAt: now.toISOString(),
          balance: result.received.amount,
          entryPriceUsd: null,
          peakPriceUsd: null,
          lastPriceUsd: null,
        };
        state.lastTradeAt = now.toISOString();
        state.spentWindowEth = Number(state.spentWindowEth || 0) + MAX_ETH;
        await appendJournal({
          timestamp: now.toISOString(),
          action: "buy",
          source: "zora:momentum-trader",
          live: true,
          address: candidate.coin.address,
          symbol: candidate.coin.symbol,
          tx: result.tx,
          spentEth: MAX_ETH,
          received: result.received.amount,
        });
      } else {
        console.log("   Action: dry-run only, no order sent");
        await appendJournal({
          timestamp: now.toISOString(),
          action: "buy-quote",
          source: "zora:momentum-trader",
          live: false,
          address: candidate.coin.address,
          symbol: candidate.coin.symbol,
          spentEth: MAX_ETH,
          estimated: quote.estimated.amount,
        });
      }
    }
  }

  state.updatedAt = now.toISOString();
  await saveState(state);

  console.log("");
  console.log(`State saved to ${STATE_FILE}`);
}

main().catch((error) => {
  console.error(`Momentum Trader failed: ${error.message}`);
  process.exit(1);
});
