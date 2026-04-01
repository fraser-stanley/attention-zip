#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  appendFile,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  fetchCoinSwaps,
  fetchProfile,
  fetchProfileBalances,
  fetchTraderLeaderboard,
  normalizeWalletAddress,
} from "./zora-public.mjs";

const execFileAsync = promisify(execFile);

const SKILL_ID = "copy-trader";
const STATE_VERSION = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOLERANCE = 1e-9;
const MAX_PROCESSED_ACTIONS = 1000;
const PROCESSED_ACTION_RETENTION_MS = 7 * DAY_MS;

const STATE_DIR = path.join(
  os.homedir(),
  ".config",
  "zora-agent-skills",
  SKILL_ID,
);
const STATE_FILE = path.join(STATE_DIR, "state.json");
const JOURNAL_FILE = path.join(STATE_DIR, "journal.jsonl");

const LIVE = readBoolean("ZORA_COPYTRADE_LIVE", false);
const SOURCE_ADDRESSES = readCsv("ZORA_COPYTRADE_SOURCE_ADDRESSES");
const IMPORT_LEADERBOARD = readBoolean(
  "ZORA_COPYTRADE_IMPORT_LEADERBOARD",
  false,
);
const LEADERBOARD_COUNT = readNumber("ZORA_COPYTRADE_LEADERBOARD_COUNT", 3, {
  min: 1,
  max: 10,
});
const SPEND_TOKEN = readToken("ZORA_COPYTRADE_SPEND_TOKEN", "eth");
const EXIT_TOKEN = readToken("ZORA_COPYTRADE_EXIT_TOKEN", "eth");
const SOURCE_SCALE_PCT = readNumber("ZORA_COPYTRADE_SOURCE_SCALE_PCT", 100, {
  min: 1,
  max: 200,
});
const MAX_BUY_USD = readNumber("ZORA_COPYTRADE_MAX_BUY_USD", 25, {
  min: 1,
  max: 5000,
});
const DAILY_CAP_USD = readNumber("ZORA_COPYTRADE_DAILY_CAP_USD", 100, {
  min: 1,
  max: 10000,
});
const MAX_POSITIONS = readNumber("ZORA_COPYTRADE_MAX_POSITIONS", 5, {
  min: 1,
  max: 20,
});
const MIN_SOURCE_DELTA_USD = readNumber(
  "ZORA_COPYTRADE_MIN_SOURCE_DELTA_USD",
  25,
  {
    min: 1,
    max: 5000,
  },
);
const MAX_SLIPPAGE_PCT = readNumber("ZORA_COPYTRADE_MAX_SLIPPAGE_PCT", 3, {
  min: 0.1,
  max: 99,
});
const MAX_QUOTE_SLIPPAGE_PCT = readNumber(
  "ZORA_COPYTRADE_MAX_QUOTE_SLIPPAGE_PCT",
  5,
  {
    min: 0.5,
    max: 99,
  },
);
const MAX_CONCENTRATION_PCT = readNumber(
  "ZORA_COPYTRADE_MAX_CONCENTRATION_PCT",
  35,
  {
    min: 1,
    max: 100,
  },
);
const CONFIRMATION_LOOKBACK_MIN = readNumber(
  "ZORA_COPYTRADE_CONFIRMATION_LOOKBACK_MIN",
  30,
  {
    min: 1,
    max: 1440,
  },
);
const ENTRY_FRESHNESS_SEC = readNumber(
  "ZORA_COPYTRADE_ENTRY_FRESHNESS_SEC",
  90,
  {
    min: 30,
    max: 3600,
  },
);
const EXIT_FRESHNESS_SEC = readNumber(
  "ZORA_COPYTRADE_EXIT_FRESHNESS_SEC",
  600,
  {
    min: 60,
    max: 3600,
  },
);
const MAX_ENTRY_PRICE_DRIFT_PCT = readNumber(
  "ZORA_COPYTRADE_MAX_ENTRY_PRICE_DRIFT_PCT",
  8,
  {
    min: 0.5,
    max: 100,
  },
);
const MAX_EXIT_PRICE_DRIFT_PCT = readNumber(
  "ZORA_COPYTRADE_MAX_EXIT_PRICE_DRIFT_PCT",
  15,
  {
    min: 0.5,
    max: 100,
  },
);
const COOLDOWN_SEC = readNumber("ZORA_COPYTRADE_COOLDOWN_SEC", 300, {
  min: 0,
  max: 86400,
});
const ALLOW_EXISTING_POSITIONS = readBoolean(
  "ZORA_COPYTRADE_ALLOW_EXISTING_POSITIONS",
  false,
);

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

function readCsv(name) {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readToken(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (["eth", "usdc", "zora"].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function trimNumber(value, decimals = 4) {
  return Number(value || 0)
    .toFixed(decimals)
    .replace(/\.?0+$/, "");
}

function formatAge(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return "unknown";
  }

  const totalSeconds = Math.round(ageMs / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const totalHours = Math.round(totalMinutes / 60);
  return `${totalHours}h`;
}

function normalizeAddress(value) {
  return normalizeWalletAddress(value)?.toLowerCase() ?? null;
}

function coinKey(address) {
  return normalizeAddress(address) ?? String(address || "unknown").toLowerCase();
}

function ensureStateShape(state) {
  return {
    version: STATE_VERSION,
    updatedAt: state?.updatedAt ?? null,
    lastHealthyAt: state?.lastHealthyAt ?? null,
    lastTradeAt: state?.lastTradeAt ?? null,
    mode: state?.mode ?? "dry-run",
    spendWindowStartedAt: state?.spendWindowStartedAt ?? null,
    spentWindowUsd: Number(state?.spentWindowUsd || 0),
    watchedWallets: state?.watchedWallets ?? {},
    copiedPositions: state?.copiedPositions ?? {},
    processedActions: state?.processedActions ?? {},
    health: state?.health ?? "healthy",
    reconcileNotes: Array.isArray(state?.reconcileNotes)
      ? state.reconcileNotes
      : [],
  };
}

function stateCorruptPath(now) {
  const suffix = now.toISOString().replace(/[:.]/g, "-");
  return path.join(STATE_DIR, `state.corrupt.${suffix}.json`);
}

async function moveStateToCorrupt(now) {
  try {
    await mkdir(STATE_DIR, { recursive: true });
    await rename(STATE_FILE, stateCorruptPath(now));
  } catch {
    // Ignore recovery failures and fall back to a fresh in-memory state.
  }
}

async function loadState(now) {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STATE_VERSION) {
      throw new Error("Invalid state schema");
    }

    return {
      state: ensureStateShape(parsed),
      warnings: [],
      forceDryRun: false,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        state: ensureStateShape(null),
        warnings: [],
        forceDryRun: false,
      };
    }

    await moveStateToCorrupt(now);
    return {
      state: ensureStateShape(null),
      warnings: ["state recovered from corruption, dry-run forced this cycle"],
      forceDryRun: true,
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
    state.spentWindowUsd = 0;
    return;
  }

  const startedAt = new Date(state.spendWindowStartedAt);
  if (Number.isNaN(startedAt.getTime())) {
    state.spendWindowStartedAt = now.toISOString();
    state.spentWindowUsd = 0;
    return;
  }

  if (now.getTime() - startedAt.getTime() >= DAY_MS) {
    state.spendWindowStartedAt = now.toISOString();
    state.spentWindowUsd = 0;
  }
}

function buildFollowerContext(payload) {
  const wallet = Array.isArray(payload?.wallet) ? payload.wallet : [];
  const coins = Array.isArray(payload?.coins) ? payload.coins : [];

  const walletBySymbol = Object.fromEntries(
    wallet.map((asset) => [
      String(asset?.symbol || "").toLowerCase(),
      {
        balance: Number(asset?.balance || 0),
        usdValue: Number(asset?.usdValue || 0),
        priceUsd: Number(asset?.priceUsd || 0),
      },
    ]),
  );

  const coinsById = Object.fromEntries(
    coins
      .map((coin) => {
        const address = normalizeWalletAddress(coin?.address);
        if (!address) return null;

        return [
          address.toLowerCase(),
          {
            address,
            name: coin?.name ?? address,
            symbol: coin?.symbol ?? "UNKNOWN",
            balance: Number(coin?.balance || 0),
            usdValue: Number(coin?.usdValue || 0),
            priceUsd: Number(coin?.priceUsd || 0),
          },
        ];
      })
      .filter(Boolean),
  );

  const walletUsd = Object.values(walletBySymbol).reduce(
    (sum, asset) => sum + Number(asset.usdValue || 0),
    0,
  );
  const totalCoinUsd = Object.values(coinsById).reduce(
    (sum, coin) => sum + Number(coin.usdValue || 0),
    0,
  );

  return {
    walletBySymbol,
    coinsById,
    walletUsd,
    totalCoinUsd,
  };
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
        // Ignore parse errors and fall through to stderr/message.
      }
    }

    const stderr = error.stderr?.toString().trim();
    throw new Error(stderr || error.message);
  }
}

function classifyDelta(previousPosition, currentPosition) {
  const previousBalanceUsd = Number(previousPosition?.balanceUsd || 0);
  const currentBalanceUsd = Number(currentPosition?.balanceUsd || 0);
  const deltaUsd = currentBalanceUsd - previousBalanceUsd;

  if (Math.abs(deltaUsd) < MIN_SOURCE_DELTA_USD) {
    return null;
  }

  if (previousBalanceUsd <= 0 && currentBalanceUsd > 0) {
    return "entry";
  }

  if (previousBalanceUsd > 0 && currentBalanceUsd <= 0) {
    return "exit";
  }

  if (deltaUsd > 0) {
    return "add";
  }

  if (deltaUsd < 0) {
    return "trim";
  }

  return null;
}

function buildPositionMap(positions) {
  return Object.fromEntries(
    positions.map((position) => [coinKey(position.address), position]),
  );
}

function actionLabel(action) {
  return action === "entry" || action === "add" ? "BUY" : "SELL";
}

function isBuyAction(action) {
  return action === "entry" || action === "add";
}

function freshnessWindowSec(action) {
  return isBuyAction(action) ? ENTRY_FRESHNESS_SEC : EXIT_FRESHNESS_SEC;
}

function sourceActionType(action) {
  return isBuyAction(action) ? "BUY" : "SELL";
}

function ageFromTimestamp(timestamp, now) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const ageMs = now.getTime() - date.getTime();
  return ageMs >= 0 ? ageMs : null;
}

function isWithinConfirmationLookback(timestamp, now) {
  const ageMs = ageFromTimestamp(timestamp, now);
  return ageMs !== null && ageMs <= CONFIRMATION_LOOKBACK_MIN * 60 * 1000;
}

function activeCopiedPositionCount(copiedPositions) {
  return Object.values(copiedPositions).filter((position) =>
    Object.values(position?.sources ?? {}).some((source) => source?.active),
  ).length;
}

function tokenPriceUsd(symbol, followerContext) {
  if (symbol === "usdc") return 1;
  return Number(followerContext.walletBySymbol[symbol]?.priceUsd || 0);
}

function sourceNotionalUsd(swap, fallbackUsd) {
  const quoteAmount = Number(swap?.quoteAmount || 0);
  const quotePriceUsdc = Number(swap?.quotePriceUsdc || 1);
  const quoteUsd =
    quoteAmount > 0
      ? quoteAmount * (Number.isFinite(quotePriceUsdc) && quotePriceUsdc > 0
        ? quotePriceUsdc
        : 1)
      : 0;

  if (Number.isFinite(quoteUsd) && quoteUsd > 0) {
    return quoteUsd;
  }

  return Math.abs(Number(fallbackUsd || 0));
}

function sourceUnitPriceUsd(swap, notionalUsd) {
  const coinAmount = Number(swap?.coinAmount || 0);
  if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
    return null;
  }

  return notionalUsd / coinAmount;
}

function extractQuoteSlippage(payload) {
  const value = Number(payload?.slippage);
  return Number.isFinite(value) ? value : 0;
}

function extractBuyUnits(payload) {
  const candidates = [
    payload?.estimated?.amount,
    payload?.bought?.amount,
    payload?.received?.amount,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return 0;
}

function extractBuyQuoteUnitPriceUsd(payload, plannedUsd) {
  const units = extractBuyUnits(payload);
  if (!units) return null;
  return plannedUsd / units;
}

function extractSellQuoteUnitPriceUsd(
  payload,
  soldUnits,
  exitTokenPriceUsd,
) {
  const receivedAmount = Number(
    payload?.received?.amount ?? payload?.estimated?.amount ?? 0,
  );
  if (
    !Number.isFinite(receivedAmount) ||
    receivedAmount <= 0 ||
    !Number.isFinite(exitTokenPriceUsd) ||
    exitTokenPriceUsd <= 0 ||
    !Number.isFinite(soldUnits) ||
    soldUnits <= 0
  ) {
    return null;
  }

  return (receivedAmount * exitTokenPriceUsd) / soldUnits;
}

function computePriceDriftPct(action, sourcePriceUsd, currentPriceUsd) {
  if (
    !Number.isFinite(sourcePriceUsd) ||
    sourcePriceUsd <= 0 ||
    !Number.isFinite(currentPriceUsd) ||
    currentPriceUsd <= 0
  ) {
    return null;
  }

  if (isBuyAction(action)) {
    return ((currentPriceUsd - sourcePriceUsd) / sourcePriceUsd) * 100;
  }

  return ((sourcePriceUsd - currentPriceUsd) / sourcePriceUsd) * 100;
}

function driftGate(action) {
  return isBuyAction(action)
    ? MAX_ENTRY_PRICE_DRIFT_PCT
    : MAX_EXIT_PRICE_DRIFT_PCT;
}

function describeBuyQuote(payload, plannedUsd, driftPct, sourceAgeMs) {
  const amount =
    payload?.estimated?.amount ??
    payload?.bought?.amount ??
    payload?.received?.amount ??
    "0";
  const symbol =
    payload?.estimated?.symbol ??
    payload?.bought?.symbol ??
    payload?.received?.symbol ??
    payload?.coin ??
    "TOKENS";
  const driftPart =
    driftPct === null
      ? "drift unavailable"
      : `drift ${driftPct >= 0 ? "+" : ""}${driftPct.toFixed(1)}%`;

  return `Quote: ${formatUsd(plannedUsd)} -> ${amount} ${symbol}, age ${formatAge(sourceAgeMs)}, ${driftPart}`;
}

function describeSellQuote(payload, sellPercent, driftPct, sourceAgeMs) {
  const amount =
    payload?.received?.amount ??
    payload?.estimated?.amount ??
    payload?.sold?.amount ??
    "0";
  const symbol =
    payload?.received?.symbol ??
    payload?.estimated?.symbol ??
    payload?.sold?.symbol ??
    EXIT_TOKEN.toUpperCase();
  const driftPart =
    driftPct === null
      ? "drift unavailable"
      : `drift ${driftPct >= 0 ? "+" : ""}${driftPct.toFixed(1)}%`;

  return `Quote: ${sellPercent.toFixed(1)}% -> ${amount} ${symbol}, age ${formatAge(sourceAgeMs)}, ${driftPart}`;
}

function calculatePlannedBuyUsd(candidate, followerContext, state, copiedPositions) {
  const assetBudget = Number(
    followerContext.walletBySymbol[SPEND_TOKEN]?.usdValue || 0,
  );
  const dailyRemaining = Math.max(DAILY_CAP_USD - state.spentWindowUsd, 0);
  const scaledNotional =
    Number(candidate.sourceNotionalUsd || Math.abs(candidate.deltaUsd || 0)) *
    (SOURCE_SCALE_PCT / 100);
  const plannedUsd = Math.min(
    scaledNotional,
    MAX_BUY_USD,
    dailyRemaining,
    assetBudget,
  );

  if (!Number.isFinite(plannedUsd) || plannedUsd <= 0) {
    return {
      ok: false,
      reason: "No spendable balance is available for copied buys",
    };
  }

  if (
    !copiedPositions[candidate.coinId] &&
    activeCopiedPositionCount(copiedPositions) >= MAX_POSITIONS
  ) {
    return {
      ok: false,
      reason: `Max copied positions reached (${MAX_POSITIONS})`,
    };
  }

  const existingUsd = Number(
    followerContext.coinsById[candidate.coinId]?.usdValue || 0,
  );
  const nextTotalUsd = Math.max(
    followerContext.totalCoinUsd + followerContext.walletUsd,
    existingUsd + plannedUsd,
  );
  const nextConcentration =
    nextTotalUsd > 0 ? ((existingUsd + plannedUsd) / nextTotalUsd) * 100 : 0;

  if (nextConcentration > MAX_CONCENTRATION_PCT) {
    return {
      ok: false,
      reason: `Entry would push concentration to ${nextConcentration.toFixed(1)}%`,
    };
  }

  return {
    ok: true,
    plannedUsd,
  };
}

function pruneProcessedActions(processedActions, now) {
  const entries = Object.entries(processedActions ?? {})
    .filter(([, value]) => {
      const seenAt = new Date(value?.seenAt ?? 0);
      if (Number.isNaN(seenAt.getTime())) {
        return false;
      }
      return now.getTime() - seenAt.getTime() <= PROCESSED_ACTION_RETENTION_MS;
    })
    .sort(
      (left, right) =>
        new Date(right[1]?.seenAt ?? 0).getTime() -
        new Date(left[1]?.seenAt ?? 0).getTime(),
    )
    .slice(0, MAX_PROCESSED_ACTIONS);

  return Object.fromEntries(entries);
}

function reconcileCopiedPositions(state, followerContext, now) {
  const notes = [];
  const nextCopiedPositions = {};
  let severeMismatch = false;

  for (const [coinId, position] of Object.entries(state.copiedPositions ?? {})) {
    const sources = position?.sources ?? {};
    const activeSources = Object.entries(sources)
      .filter(([, source]) => Number(source?.followerUnits || 0) > TOLERANCE)
      .map(([sourceWallet, source]) => [sourceWallet, { ...source }]);

    if (activeSources.length === 0) {
      continue;
    }

    const followerBalance = Number(followerContext.coinsById[coinId]?.balance || 0);
    const attributedUnits = activeSources.reduce(
      (sum, [, source]) => sum + Number(source.followerUnits || 0),
      0,
    );

    if (followerBalance <= TOLERANCE) {
      severeMismatch = severeMismatch || attributedUnits > TOLERANCE;
      notes.push(
        `${position.name ?? coinId}: follower wallet no longer holds this copied coin`,
      );
      continue;
    }

    let scaledSources = Object.fromEntries(activeSources);
    if (followerBalance + TOLERANCE < attributedUnits) {
      severeMismatch = true;
      const scale = followerBalance / attributedUnits;
      notes.push(
        `${position.name ?? coinId}: scaled copied subpositions down to wallet balance`,
      );

      scaledSources = Object.fromEntries(
        activeSources.map(([sourceWallet, source]) => {
          const nextUnits = Number(source.followerUnits || 0) * scale;
          const nextCostUsd = Number(source.followerCostUsd || 0) * scale;
          return [
            sourceWallet,
            {
              ...source,
              followerUnits: nextUnits,
              followerCostUsd: nextCostUsd,
              active: nextUnits > TOLERANCE,
            },
          ];
        }),
      );
    }

    if (
      !ALLOW_EXISTING_POSITIONS &&
      followerBalance > attributedUnits + TOLERANCE
    ) {
      notes.push(
        `${position.name ?? coinId}: wallet holds extra units outside copy-trader attribution`,
      );
    }

    const cleanedSources = Object.fromEntries(
      Object.entries(scaledSources).filter(
        ([, source]) => source?.active && Number(source.followerUnits || 0) > TOLERANCE,
      ),
    );

    if (Object.keys(cleanedSources).length === 0) {
      continue;
    }

    nextCopiedPositions[coinId] = {
      ...position,
      sources: cleanedSources,
    };
  }

  state.copiedPositions = nextCopiedPositions;
  state.reconcileNotes = [
    ...(Array.isArray(state.reconcileNotes) ? state.reconcileNotes : []),
    ...notes,
  ].slice(-20);
  state.health = severeMismatch ? "degraded" : "healthy";
  if (!severeMismatch) {
    state.lastHealthyAt = now.toISOString();
  }

  return {
    severeMismatch,
    notes,
  };
}

function baseJournalFields(candidate, now, mode, health) {
  return {
    action: candidate.action,
    liveRequested: LIVE,
    mode,
    health,
    sourceWallet: candidate.sourceWallet,
    sourceDisplayName: candidate.sourceDisplayName,
    sourceType: candidate.sourceType,
    coinAddress: candidate.address,
    coinName: candidate.name,
    sourceDeltaUsd: candidate.deltaUsd,
    sourceAgeSec:
      candidate.sourceAgeMs === null || candidate.sourceAgeMs === undefined
        ? null
        : Math.round(candidate.sourceAgeMs / 1000),
    freshnessStatus: candidate.freshnessStatus ?? null,
    sourceNotionalUsd: candidate.sourceNotionalUsd ?? null,
    sourceUnitPriceUsd: candidate.sourceUnitPriceUsd ?? null,
    confirmed: candidate.confirmed,
    processedAt: now.toISOString(),
  };
}

async function main() {
  const now = new Date();
  const loadResult = await loadState(now);
  const state = loadResult.state;
  state.processedActions = pruneProcessedActions(state.processedActions, now);
  resetSpendWindowIfNeeded(state, now);

  const followerPayload = await runZora(["balance", "--json"]);
  const followerContext = buildFollowerContext(followerPayload);
  const reconcileResult = reconcileCopiedPositions(state, followerContext, now);

  const warnings = [
    ...loadResult.warnings,
    ...reconcileResult.notes,
  ];

  const forceDryRun = loadResult.forceDryRun;
  const allowLiveEntries =
    LIVE && !forceDryRun && !reconcileResult.severeMismatch;
  const allowLiveExits = LIVE && !forceDryRun;
  const mode = LIVE && !forceDryRun ? "live" : "dry-run";
  state.mode = mode;

  const sourceCandidates = [];
  for (const identifier of SOURCE_ADDRESSES) {
    sourceCandidates.push({
      identifier,
      sourceType: "manual",
      score: null,
      volume: null,
    });
  }

  if (IMPORT_LEADERBOARD) {
    const leaderboard = await fetchTraderLeaderboard(LEADERBOARD_COUNT);
    for (const trader of leaderboard) {
      sourceCandidates.push({
        identifier: trader.identifier,
        sourceType: "leaderboard",
        score: trader.score,
        volume: trader.volume,
      });
    }
  }

  const watchedWallets = {};
  const resolvedSources = [];
  const seenWallets = new Set();

  for (const candidate of sourceCandidates) {
    const profile = await fetchProfile(candidate.identifier);
    if (!profile?.walletAddress) {
      continue;
    }

    const walletKey = profile.walletAddress.toLowerCase();
    if (seenWallets.has(walletKey)) {
      continue;
    }

    seenWallets.add(walletKey);
    resolvedSources.push({
      sourceType: candidate.sourceType,
      identifier: candidate.identifier,
      walletAddress: profile.walletAddress,
      displayName: profile.handle ?? profile.walletAddress,
      profileId: profile.profileId,
      lastScore: candidate.score,
      lastVolumeUsd: candidate.volume,
    });
  }

  const discoveredActions = [];
  for (const source of resolvedSources) {
    const previousWallet =
      state.watchedWallets[source.walletAddress.toLowerCase()] ?? {};
    const currentPositions = await fetchProfileBalances(source.walletAddress, 50);
    const currentById = buildPositionMap(currentPositions);
    const previousById = previousWallet.positions ?? {};
    const allIds = new Set([
      ...Object.keys(previousById),
      ...Object.keys(currentById),
    ]);

    watchedWallets[source.walletAddress.toLowerCase()] = {
      sourceType: source.sourceType,
      identifier: source.identifier,
      walletAddress: source.walletAddress,
      displayName: source.displayName,
      profileId: source.profileId,
      lastSeenAt: now.toISOString(),
      lastScore: source.lastScore,
      lastVolumeUsd: source.lastVolumeUsd,
      positions: currentById,
    };

    for (const id of allIds) {
      const previousPosition = previousById[id];
      const currentPosition = currentById[id];
      const action = classifyDelta(previousPosition, currentPosition);
      if (!action) continue;

      const referencePosition = currentPosition ?? previousPosition;
      discoveredActions.push({
        sourceWallet: source.walletAddress,
        sourceType: source.sourceType,
        sourceDisplayName: source.displayName,
        coinId: id,
        address: referencePosition.address,
        name: referencePosition.name,
        symbol: referencePosition.symbol,
        action,
        deltaUsd:
          Number(currentPosition?.balanceUsd || 0) -
          Number(previousPosition?.balanceUsd || 0),
        previousBalance: Number(previousPosition?.balance || 0),
        previousBalanceUsd: Number(previousPosition?.balanceUsd || 0),
        currentBalance: Number(currentPosition?.balance || 0),
        currentBalanceUsd: Number(currentPosition?.balanceUsd || 0),
      });
    }
  }

  const actionable = [];
  for (const candidate of discoveredActions) {
    const swapData = await fetchCoinSwaps(candidate.address, 20);
    const desiredType = sourceActionType(candidate.action);
    const sourceWalletKey = candidate.sourceWallet.toLowerCase();

    const matchedSwap = swapData.swaps
      .filter((swap) => {
        if (swap.activityType !== desiredType) return false;
        if (!isWithinConfirmationLookback(swap.blockTimestamp, now)) return false;

        const sender = normalizeAddress(swap.senderAddress);
        const recipient = normalizeAddress(swap.recipientAddress);
        return sender === sourceWalletKey || recipient === sourceWalletKey;
      })
      .sort(
        (left, right) =>
          new Date(right.blockTimestamp).getTime() -
          new Date(left.blockTimestamp).getTime(),
      )[0];

    if (!matchedSwap) {
      actionable.push({
        ...candidate,
        confirmed: false,
        reason: "snapshot change without matching swap",
      });
      continue;
    }

    const actionKey = [
      matchedSwap.transactionHash,
      sourceWalletKey,
      candidate.address.toLowerCase(),
      matchedSwap.activityType,
    ].join(":");

    const sourceAgeMs = ageFromTimestamp(matchedSwap.blockTimestamp, now);
    const freshnessStatus =
      sourceAgeMs !== null &&
      sourceAgeMs <= freshnessWindowSec(candidate.action) * 1000
        ? "fresh"
        : "stale-report-only";
    const notionalUsd = sourceNotionalUsd(matchedSwap, candidate.deltaUsd);
    const unitPriceUsd = sourceUnitPriceUsd(matchedSwap, notionalUsd);

    if (state.processedActions[actionKey]) {
      actionable.push({
        ...candidate,
        confirmed: true,
        confirmedSwap: matchedSwap,
        actionKey,
        sourceAgeMs,
        freshnessStatus,
        sourceNotionalUsd: notionalUsd,
        sourceUnitPriceUsd: unitPriceUsd,
        reason: "duplicate action already processed",
        duplicate: true,
      });
      continue;
    }

    actionable.push({
      ...candidate,
      confirmed: true,
      confirmedSwap: matchedSwap,
      actionKey,
      sourceAgeMs,
      freshnessStatus,
      sourceNotionalUsd: notionalUsd,
      sourceUnitPriceUsd: unitPriceUsd,
    });
  }

  actionable.sort((left, right) => {
    const leftPriority = isBuyAction(left.action) ? 1 : 0;
    const rightPriority = isBuyAction(right.action) ? 1 : 0;
    return leftPriority - rightPriority;
  });

  const output = [
    "Copy Trader",
    `Run at ${now.toISOString()}`,
    `Mode: ${mode}`,
    `Health: ${state.health}`,
  ];

  if (warnings.length > 0) {
    output.push("", "Warnings:");
    for (const warning of warnings) {
      output.push(`- ${warning}`);
    }
  }

  output.push(
    "",
    `Sources tracked: ${resolvedSources.length}`,
    ...resolvedSources.map(
      (source) => `- ${source.displayName}, ${source.sourceType}`,
    ),
    "",
    "Confirmed source actions:",
  );

  if (actionable.length === 0) {
    output.push("- No source changes passed the snapshot and swap checks");
  }

  for (const candidate of actionable) {
    const journalBase = baseJournalFields(candidate, now, mode, state.health);

    if (!candidate.confirmed) {
      output.push(
        `- ${actionLabel(candidate.action)} ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${candidate.reason}`,
      );
      await appendJournal({
        ...journalBase,
        action: `${candidate.action}-skipped`,
        reasoning: candidate.reason,
      });
      continue;
    }

    if (candidate.duplicate) {
      output.push(
        `- ${actionLabel(candidate.action)} ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${candidate.reason}`,
      );
      await appendJournal({
        ...journalBase,
        action: `${candidate.action}-duplicate`,
        transactionHash: candidate.confirmedSwap.transactionHash,
        reasoning: candidate.reason,
      });
      continue;
    }

    if (isBuyAction(candidate.action)) {
      if (
        !ALLOW_EXISTING_POSITIONS &&
        !state.copiedPositions[candidate.coinId] &&
        Number(followerContext.coinsById[candidate.coinId]?.balance || 0) > TOLERANCE
      ) {
        const reason =
          "existing follower exposure not opened by copy-trader";
        output.push(
          `- BUY ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${reason}`,
        );
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          transactionHash: candidate.confirmedSwap.transactionHash,
          reasoning: reason,
        });
        continue;
      }

      const sizing = calculatePlannedBuyUsd(
        candidate,
        followerContext,
        state,
        state.copiedPositions,
      );
      if (!sizing.ok) {
        output.push(
          `- BUY ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${sizing.reason}`,
        );
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          transactionHash: candidate.confirmedSwap.transactionHash,
          reasoning: sizing.reason,
        });
        continue;
      }

      if (
        state.lastTradeAt &&
        now.getTime() - new Date(state.lastTradeAt).getTime() <
          COOLDOWN_SEC * 1000
      ) {
        const reason = "cooldown active";
        output.push(
          `- BUY ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${reason}`,
        );
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          plannedFollowerDeltaUsd: sizing.plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          reasoning: reason,
        });
        continue;
      }

      const plannedUsd = sizing.plannedUsd;
      const quote = await runZora([
        "buy",
        candidate.address,
        "--usd",
        trimNumber(plannedUsd, 2),
        "--token",
        SPEND_TOKEN,
        "--quote",
        "--json",
      ]);
      const quoteSlippage = extractQuoteSlippage(quote);
      const currentUnitPriceUsd = extractBuyQuoteUnitPriceUsd(quote, plannedUsd);
      const priceDriftPct = computePriceDriftPct(
        candidate.action,
        candidate.sourceUnitPriceUsd,
        currentUnitPriceUsd,
      );
      const staleReason =
        candidate.freshnessStatus === "fresh"
          ? null
          : "stale entry, live mode skipped";

      output.push(
        `- BUY ${candidate.name} from ${candidate.sourceDisplayName}, source age ${formatAge(candidate.sourceAgeMs)}, source ${formatUsd(candidate.sourceNotionalUsd)}, planned copy ${formatUsd(plannedUsd)}`,
      );
      output.push(
        `  ${describeBuyQuote(
          quote,
          plannedUsd,
          priceDriftPct,
          candidate.sourceAgeMs,
        )}`,
      );

      if (staleReason) {
        output.push(`  Action: skipped, ${staleReason}`);
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          plannedFollowerDeltaUsd: plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          quote,
          currentUnitPriceUsd,
          priceDriftPct,
          reasoning: staleReason,
        });
        continue;
      }

      if (
        priceDriftPct !== null &&
        priceDriftPct > driftGate(candidate.action)
      ) {
        const reason = `worse than source by ${priceDriftPct.toFixed(1)}%, above ${driftGate(candidate.action).toFixed(1)}% drift gate`;
        output.push(`  Action: skipped, ${reason}`);
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          plannedFollowerDeltaUsd: plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          quote,
          currentUnitPriceUsd,
          priceDriftPct,
          reasoning: reason,
        });
        continue;
      }

      if (quoteSlippage > MAX_QUOTE_SLIPPAGE_PCT) {
        const reason = `quote slippage ${quoteSlippage.toFixed(1)}% is above the ${MAX_QUOTE_SLIPPAGE_PCT.toFixed(1)}% gate`;
        output.push(`  Action: skipped, ${reason}`);
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          plannedFollowerDeltaUsd: plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          quote,
          currentUnitPriceUsd,
          priceDriftPct,
          reasoning: reason,
        });
        continue;
      }

      if (!LIVE || forceDryRun) {
        const reason =
          warnings[0] ?? "fresh entry, quote cleared all gates";
        output.push("  Action: dry-run only, no order sent");
        await appendJournal({
          ...journalBase,
          action: "buy-quote",
          plannedFollowerDeltaUsd: plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          quote,
          currentUnitPriceUsd,
          priceDriftPct,
          reasoning: reason,
        });
        continue;
      }

      if (!allowLiveEntries) {
        const reason =
          "reconciliation mismatch detected, new live entries blocked this cycle";
        output.push(`  Action: skipped, ${reason}`);
        await appendJournal({
          ...journalBase,
          action: "buy-skipped",
          plannedFollowerDeltaUsd: plannedUsd,
          transactionHash: candidate.confirmedSwap.transactionHash,
          quote,
          currentUnitPriceUsd,
          priceDriftPct,
          reasoning: reason,
        });
        continue;
      }

      const execution = await runZora([
        "buy",
        candidate.address,
        "--usd",
        trimNumber(plannedUsd, 2),
        "--token",
        SPEND_TOKEN,
        "--slippage",
        trimNumber(MAX_SLIPPAGE_PCT, 2),
        "--json",
        "--yes",
      ]);

      const copiedPosition = state.copiedPositions[candidate.coinId] ?? {
        address: candidate.address,
        name: candidate.name,
        symbol: candidate.symbol,
        sources: {},
      };
      const existingSource = copiedPosition.sources[candidate.sourceWallet] ?? {
        followerUnits: 0,
        followerCostUsd: 0,
        sourceBalance: 0,
        sourceBalanceUsd: 0,
        sourceLastActionAt: null,
        sourceLastTxHash: null,
        active: false,
      };
      const boughtUnits = extractBuyUnits(execution) || extractBuyUnits(quote);

      copiedPosition.sources[candidate.sourceWallet] = {
        followerUnits: existingSource.followerUnits + boughtUnits,
        followerCostUsd: existingSource.followerCostUsd + plannedUsd,
        sourceBalance: candidate.currentBalance,
        sourceBalanceUsd: candidate.currentBalanceUsd,
        sourceLastActionAt: candidate.confirmedSwap.blockTimestamp,
        sourceLastTxHash: candidate.confirmedSwap.transactionHash,
        active: true,
      };
      state.copiedPositions[candidate.coinId] = copiedPosition;
      state.processedActions[candidate.actionKey] = {
        seenAt: now.toISOString(),
        txHash: candidate.confirmedSwap.transactionHash,
        sourceWallet: candidate.sourceWallet,
        coinAddress: candidate.address,
        action: candidate.action,
      };
      state.spentWindowUsd += plannedUsd;
      state.lastTradeAt = now.toISOString();

      output.push("  Action: live buy sent, tx " + (execution.tx ?? "unknown"));
      await appendJournal({
        ...journalBase,
        action: "buy",
        plannedFollowerDeltaUsd: plannedUsd,
        transactionHash: candidate.confirmedSwap.transactionHash,
        tx: execution.tx,
        quote,
        execution,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: "fresh entry, quote cleared all gates",
      });
      continue;
    }

    const copiedPosition = state.copiedPositions[candidate.coinId];
    const sourceState = copiedPosition?.sources?.[candidate.sourceWallet];
    if (!copiedPosition || !sourceState?.active) {
      const reason = "no copied subposition exists for this source";
      output.push(
        `- SELL ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${reason}`,
      );
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        transactionHash: candidate.confirmedSwap.transactionHash,
        reasoning: reason,
      });
      continue;
    }

    const previousBalance = Math.max(
      candidate.previousBalance,
      Number(sourceState.sourceBalance || 0),
      0,
    );
    const trimRatio =
      candidate.action === "exit"
        ? 1
        : previousBalance > 0
          ? Math.min(
              1,
              Math.max(
                0,
                (previousBalance - candidate.currentBalance) / previousBalance,
              ),
            )
          : 0;

    if (trimRatio <= 0) {
      const reason = "trim ratio is not actionable";
      output.push(
        `- SELL ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${reason}`,
      );
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        transactionHash: candidate.confirmedSwap.transactionHash,
        reasoning: reason,
      });
      continue;
    }

    const followerBalance =
      Number(followerContext.coinsById[candidate.coinId]?.balance || 0) ||
      Object.values(copiedPosition.sources).reduce(
        (sum, value) => sum + Number(value.followerUnits || 0),
        0,
      );
    const unitsToSell = Number(sourceState.followerUnits || 0) * trimRatio;
    const sellPercent =
      followerBalance > 0 ? Math.min(100, (unitsToSell / followerBalance) * 100) : 0;

    if (sellPercent <= 0 || unitsToSell <= TOLERANCE) {
      const reason = "follower position is too small to trim";
      output.push(
        `- SELL ${candidate.name} from ${candidate.sourceDisplayName} skipped, ${reason}`,
      );
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        transactionHash: candidate.confirmedSwap.transactionHash,
        reasoning: reason,
      });
      continue;
    }

    const quote = await runZora([
      "sell",
      candidate.address,
      "--percent",
      trimNumber(sellPercent, 4),
      "--to",
      EXIT_TOKEN,
      "--quote",
      "--json",
    ]);
    const quoteSlippage = extractQuoteSlippage(quote);
    const currentUnitPriceUsd = extractSellQuoteUnitPriceUsd(
      quote,
      unitsToSell,
      tokenPriceUsd(EXIT_TOKEN, followerContext),
    );
    const priceDriftPct = computePriceDriftPct(
      candidate.action,
      candidate.sourceUnitPriceUsd,
      currentUnitPriceUsd,
    );
    const staleReason =
      candidate.freshnessStatus === "fresh"
        ? null
        : "stale exit, live mode skipped";

    output.push(
      `- SELL ${candidate.name} from ${candidate.sourceDisplayName}, source age ${formatAge(candidate.sourceAgeMs)}, source ${formatUsd(candidate.sourceNotionalUsd)}, planned trim ${sellPercent.toFixed(1)}%`,
    );
    output.push(
      `  ${describeSellQuote(
        quote,
        sellPercent,
        priceDriftPct,
        candidate.sourceAgeMs,
      )}`,
    );

    if (staleReason) {
      output.push(`  Action: skipped, ${staleReason}`);
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
        transactionHash: candidate.confirmedSwap.transactionHash,
        quote,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: staleReason,
      });
      continue;
    }

    if (
      priceDriftPct !== null &&
      priceDriftPct > driftGate(candidate.action)
    ) {
      const reason = `worse than source by ${priceDriftPct.toFixed(1)}%, above ${driftGate(candidate.action).toFixed(1)}% drift gate`;
      output.push(`  Action: skipped, ${reason}`);
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
        transactionHash: candidate.confirmedSwap.transactionHash,
        quote,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: reason,
      });
      continue;
    }

    if (quoteSlippage > MAX_QUOTE_SLIPPAGE_PCT) {
      const reason = `quote slippage ${quoteSlippage.toFixed(1)}% is above the ${MAX_QUOTE_SLIPPAGE_PCT.toFixed(1)}% gate`;
      output.push(`  Action: skipped, ${reason}`);
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
        transactionHash: candidate.confirmedSwap.transactionHash,
        quote,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: reason,
      });
      continue;
    }

    if (!LIVE || forceDryRun) {
      const reason =
        warnings[0] ?? "fresh exit, quote cleared all gates";
      output.push("  Action: dry-run only, no order sent");
      await appendJournal({
        ...journalBase,
        action: "sell-quote",
        plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
        transactionHash: candidate.confirmedSwap.transactionHash,
        quote,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: reason,
      });
      continue;
    }

    if (!allowLiveExits) {
      const reason = "state recovered from corruption, dry-run forced this cycle";
      output.push(`  Action: skipped, ${reason}`);
      await appendJournal({
        ...journalBase,
        action: "sell-skipped",
        plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
        transactionHash: candidate.confirmedSwap.transactionHash,
        quote,
        currentUnitPriceUsd,
        priceDriftPct,
        reasoning: reason,
      });
      continue;
    }

    const execution = await runZora([
      "sell",
      candidate.address,
      "--percent",
      trimNumber(sellPercent, 4),
      "--to",
      EXIT_TOKEN,
      "--slippage",
      trimNumber(MAX_SLIPPAGE_PCT, 2),
      "--json",
      "--yes",
    ]);

    const nextUnits = Math.max(
      0,
      Number(sourceState.followerUnits || 0) * (1 - trimRatio),
    );
    const nextCostUsd = Math.max(
      0,
      Number(sourceState.followerCostUsd || 0) * (1 - trimRatio),
    );

    copiedPosition.sources[candidate.sourceWallet] = {
      ...sourceState,
      followerUnits: nextUnits,
      followerCostUsd: nextCostUsd,
      sourceBalance: candidate.currentBalance,
      sourceBalanceUsd: candidate.currentBalanceUsd,
      sourceLastActionAt: candidate.confirmedSwap.blockTimestamp,
      sourceLastTxHash: candidate.confirmedSwap.transactionHash,
      active: nextUnits > TOLERANCE,
    };

    if (!copiedPosition.sources[candidate.sourceWallet].active) {
      delete copiedPosition.sources[candidate.sourceWallet];
    }

    if (Object.keys(copiedPosition.sources).length === 0) {
      delete state.copiedPositions[candidate.coinId];
    } else {
      state.copiedPositions[candidate.coinId] = copiedPosition;
    }

    state.processedActions[candidate.actionKey] = {
      seenAt: now.toISOString(),
      txHash: candidate.confirmedSwap.transactionHash,
      sourceWallet: candidate.sourceWallet,
      coinAddress: candidate.address,
      action: candidate.action,
    };
    state.lastTradeAt = now.toISOString();

    output.push("  Action: live sell sent, tx " + (execution.tx ?? "unknown"));
    await appendJournal({
      ...journalBase,
      action: "sell",
      plannedFollowerDeltaUsd: Math.abs(candidate.deltaUsd),
      transactionHash: candidate.confirmedSwap.transactionHash,
      tx: execution.tx,
      quote,
      execution,
      currentUnitPriceUsd,
      priceDriftPct,
      reasoning: "fresh exit, quote cleared all gates",
    });
  }

  state.updatedAt = now.toISOString();
  state.watchedWallets = watchedWallets;
  state.processedActions = pruneProcessedActions(state.processedActions, now);

  await saveState(state);
  console.log(output.join("\n"));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
