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
const STOP_LOSS_PCT = readNumber("ZORA_MOMENTUM_STOP_LOSS_PCT", 25, {
  min: 1,
  max: 95,
});
const TAKE_PROFIT_PCT = readNumber("ZORA_MOMENTUM_TAKE_PROFIT_PCT", 100, {
  min: 5,
  max: 1000,
});
const FLIPFLOP_RUNS = readNumber("ZORA_MOMENTUM_FLIPFLOP_RUNS", 3, {
  min: 1,
  max: 20,
});
const MAX_QUOTE_SLIPPAGE = readNumber(
  "ZORA_MOMENTUM_MAX_QUOTE_SLIPPAGE_PCT",
  5,
  { min: 0.5, max: 50 },
);
const CANDIDATE_CAP = 5;

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

function formatVolume(value) {
  const num = Number(value || 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
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
      recentExits: {},
      runCount: 0,
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
      stopLossPct: existing.stopLossPct ?? STOP_LOSS_PCT,
      takeProfitPct: existing.takeProfitPct ?? TAKE_PROFIT_PCT,
    };
  }

  state.positions = nextPositions;
}

function classifyExit(position) {
  if (
    !position.entryPriceUsd ||
    !position.peakPriceUsd ||
    !position.lastPriceUsd
  ) {
    return { shouldExit: false, type: null, reason: null };
  }

  const stopLoss = position.stopLossPct ?? STOP_LOSS_PCT;
  const takeProfit = position.takeProfitPct ?? TAKE_PROFIT_PCT;

  const drawdownFromEntry =
    ((position.entryPriceUsd - position.lastPriceUsd) /
      position.entryPriceUsd) *
    100;
  if (drawdownFromEntry >= stopLoss) {
    return {
      shouldExit: true,
      type: "stop-loss",
      reason: `Stop-loss fired: price ${formatUsd(position.lastPriceUsd)} is ${drawdownFromEntry.toFixed(1)}% below entry ${formatUsd(position.entryPriceUsd)}`,
    };
  }

  const gainFromEntry =
    ((position.lastPriceUsd - position.entryPriceUsd) /
      position.entryPriceUsd) *
    100;
  if (gainFromEntry >= takeProfit) {
    return {
      shouldExit: true,
      type: "take-profit",
      reason: `Take-profit fired: price ${formatUsd(position.lastPriceUsd)} is ${gainFromEntry.toFixed(1)}% above entry ${formatUsd(position.entryPriceUsd)}`,
    };
  }

  if (
    position.lastPriceUsd <=
    position.peakPriceUsd * (1 - TRAILING_STOP_PCT / 100)
  ) {
    const dropFromPeak =
      ((position.peakPriceUsd - position.lastPriceUsd) /
        position.peakPriceUsd) *
      100;
    return {
      shouldExit: true,
      type: "trailing-stop",
      reason: `Trailing stop fired: price ${formatUsd(position.lastPriceUsd)} is ${dropFromPeak.toFixed(1)}% below peak ${formatUsd(position.peakPriceUsd)}`,
    };
  }

  return { shouldExit: false, type: null, reason: null };
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

function buildBlockedIds(state) {
  const blocked = new Set();
  for (const [id, exit] of Object.entries(state.recentExits ?? {})) {
    if (state.runCount - (exit.runNumber ?? 0) < FLIPFLOP_RUNS) {
      blocked.add(id);
    }
  }
  return blocked;
}

function computeEdgeScore(changePct, volumeUsd, slippage) {
  return changePct * volumeUsd * (1 / Math.max(slippage, 0.1));
}

async function discoverCandidates(heldIds, blockedIds) {
  const [volumePayload, trendingPayload] = await Promise.all([
    runZora([
      "explore",
      "--sort",
      "volume",
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
    ...(volumePayload.coins ?? []),
    ...(trendingPayload.coins ?? []),
  ]) {
    merged.set(coinId(coin), coin);
  }

  const passing = [];
  const skippedFlipFlops = [];

  for (const coin of merged.values()) {
    const changePct = computeChangePercent(coin);
    const volumeUsd = Number(coin.volume24h || 0);
    if (heldIds.has(coinId(coin))) continue;
    if (blockedIds.has(coinId(coin))) {
      skippedFlipFlops.push(coin);
      continue;
    }
    if (changePct < MIN_GAIN_PCT) continue;
    if (volumeUsd < MIN_VOLUME_USD) continue;
    passing.push(coin);
    if (passing.length >= CANDIDATE_CAP) break;
  }

  const scored = [];
  let filteredBySlippage = 0;

  for (const coin of passing) {
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

    const slippage = Number(quote.slippage ?? 0);
    if (slippage > MAX_QUOTE_SLIPPAGE) {
      filteredBySlippage++;
      continue;
    }

    const changePct = computeChangePercent(coin);
    const volumeUsd = Number(coin.volume24h || 0);
    const edgeScore = computeEdgeScore(changePct, volumeUsd, slippage);

    scored.push({ coin, detail, quote, slippage, changePct, volumeUsd, edgeScore });
  }

  scored.sort((a, b) => b.edgeScore - a.edgeScore);

  return {
    best: scored[0] ?? null,
    evaluated: passing.length,
    filteredBySlippage,
    skippedFlipFlops,
  };
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

function pruneRecentExits(state) {
  for (const [id, exit] of Object.entries(state.recentExits)) {
    if (state.runCount - (exit.runNumber ?? 0) > FLIPFLOP_RUNS * 2) {
      delete state.recentExits[id];
    }
  }
}

async function main() {
  const state = await loadState();
  const now = new Date();

  state.recentExits ??= {};
  state.runCount = (state.runCount ?? 0) + 1;

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

  const exits = trackedPositions
    .map((position) => ({ position, ...classifyExit(position) }))
    .filter((e) => e.shouldExit);

  if (exits.length > 0) {
    console.log("");
    console.log("Exits:");
    for (const { position, type, reason } of exits) {
      if (LIVE) {
        const result = await executeExit(position);
        console.log(`- Sold ${position.name} (${type}), tx ${result.tx}`);
        await appendJournal({
          timestamp: now.toISOString(),
          action: "sell",
          source: "zora:momentum-trader",
          live: true,
          address: position.address,
          symbol: position.symbol,
          tx: result.tx,
          exitType: type,
          reasoning: reason,
        });
        delete state.positions[coinId(position)];
        state.recentExits[coinId(position)] = {
          exitedAt: now.toISOString(),
          runNumber: state.runCount,
        };
        state.lastTradeAt = now.toISOString();
      } else {
        const quote = await quoteExit(position);
        console.log(
          `- Dry-run exit for ${position.name} (${type}), estimated ${quote.estimated.amount} ${quote.estimated.symbol}`,
        );
        await appendJournal({
          timestamp: now.toISOString(),
          action: "sell-quote",
          source: "zora:momentum-trader",
          live: false,
          address: position.address,
          symbol: position.symbol,
          estimated: quote.estimated.amount,
          exitType: type,
          reasoning: reason,
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
  const blockedIds = buildBlockedIds(state);

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
    const { best, evaluated, filteredBySlippage, skippedFlipFlops } =
      await discoverCandidates(heldIds, blockedIds);

    console.log("");
    console.log(
      `Candidates (${evaluated} evaluated${filteredBySlippage > 0 ? `, ${filteredBySlippage} filtered by slippage` : ""}):`,
    );

    for (const coin of skippedFlipFlops) {
      console.log(
        `- Skipped ${coin.name}: exited recently (flip-flop guard)`,
      );
    }

    if (!best) {
      console.log(
        "- No candidate cleared the gain, volume, and quote filters",
      );
    } else {
      const quote = best.quote;
      const reasoning = `Top candidate by edge score (gain ${formatPct(best.changePct)}, vol ${formatVolume(best.volumeUsd)}, slippage ${best.slippage}%). ${evaluated} evaluated${filteredBySlippage > 0 ? `, ${filteredBySlippage} filtered by slippage` : ""}.`;

      console.log(
        `1. ${best.coin.name}, ${formatPct(best.changePct)}, ${formatVolume(best.volumeUsd)} volume, slippage ${best.slippage}%`,
      );
      console.log(
        `   Quote: ${MAX_ETH} ETH -> ${quote.estimated.amount} ${quote.estimated.symbol}`,
      );

      if (LIVE) {
        const result = await executeEntry(best);
        console.log(
          `   Action: bought ${best.coin.name}, tx ${result.tx}`,
        );
        state.positions[coinId(best.coin)] = {
          address: best.coin.address,
          name: best.coin.name,
          symbol: best.coin.symbol,
          openedAt: now.toISOString(),
          balance: result.received.amount,
          entryPriceUsd: null,
          peakPriceUsd: null,
          lastPriceUsd: null,
          stopLossPct: STOP_LOSS_PCT,
          takeProfitPct: TAKE_PROFIT_PCT,
        };
        state.lastTradeAt = now.toISOString();
        state.spentWindowEth = Number(state.spentWindowEth || 0) + MAX_ETH;
        await appendJournal({
          timestamp: now.toISOString(),
          action: "buy",
          source: "zora:momentum-trader",
          live: true,
          address: best.coin.address,
          symbol: best.coin.symbol,
          tx: result.tx,
          spentEth: MAX_ETH,
          received: result.received.amount,
          reasoning,
        });
      } else {
        console.log("   Action: dry-run only, no order sent");
        await appendJournal({
          timestamp: now.toISOString(),
          action: "buy-quote",
          source: "zora:momentum-trader",
          live: false,
          address: best.coin.address,
          symbol: best.coin.symbol,
          spentEth: MAX_ETH,
          estimated: quote.estimated.amount,
          reasoning,
        });
      }
    }
  }

  pruneRecentExits(state);
  state.updatedAt = now.toISOString();
  await saveState(state);

  console.log("");
  console.log(`State saved to ${STATE_FILE}`);
}

main().catch((error) => {
  console.error(`Momentum Trader failed: ${error.message}`);
  process.exit(1);
});
