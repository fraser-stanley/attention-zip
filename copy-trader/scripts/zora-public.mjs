const DEFAULT_BASE_URL = "https://api-sdk.zora.engineering";
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function apiBaseUrl() {
  return process.env.ZORA_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;
}

export function normalizeWalletAddress(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return ADDRESS_PATTERN.test(trimmed) ? trimmed : null;
}

function buildHeaders() {
  const headers = {
    accept: "application/json",
    connection: "close",
  };

  if (process.env.ZORA_API_KEY) {
    headers["api-key"] = process.env.ZORA_API_KEY;
  }

  return headers;
}

async function apiGet(path, query) {
  const url = new URL(path, apiBaseUrl());

  for (const [key, rawValue] of Object.entries(query ?? {})) {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        url.searchParams.append(key, String(value));
      }
      continue;
    }

    url.searchParams.set(key, String(rawValue));
  }

  const response = await fetch(url, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zora public API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export async function fetchProfile(identifier) {
  const payload = await apiGet("/profile", { identifier });
  const profile = payload?.profile;

  if (!profile) return null;

  const linkedWallets = (profile.linkedWallets?.edges ?? [])
    .map((edge) => {
      const walletAddress = normalizeWalletAddress(edge?.node?.walletAddress);
      if (!walletAddress) return null;

      return {
        walletAddress,
        walletType: edge?.node?.walletType,
      };
    })
    .filter(Boolean);

  const walletAddress =
    normalizeWalletAddress(profile.publicWallet?.walletAddress) ??
    linkedWallets[0]?.walletAddress ??
    normalizeWalletAddress(identifier) ??
    undefined;

  return {
    identifier,
    handle: profile.handle,
    walletAddress,
    linkedWallets,
    profileId: profile.id,
    avatarMedium: profile.avatar?.previewImage?.medium,
    avatarSmall: profile.avatar?.previewImage?.small,
  };
}

export async function fetchProfileBalances(identifier, count = 50) {
  const payload = await apiGet("/profileBalances", {
    identifier,
    count,
    sortOption: "MARKET_VALUE_USD",
    excludeHidden: true,
    chainIds: 8453,
  });

  return (payload?.profile?.coinBalances?.edges ?? [])
    .map((edge) => {
      const node = edge?.node;
      const coin = node?.coin;
      const address = normalizeWalletAddress(coin?.address);
      if (!address) return null;

      const balance = Number(node?.balance || 0);
      const directBalanceUsd = Number(node?.balanceUsd);
      const priceInUsdc = Number(coin?.tokenPrice?.priceInUsdc || 0);
      const balanceUsd = Number.isFinite(directBalanceUsd) && directBalanceUsd > 0
        ? directBalanceUsd
        : balance * priceInUsdc;

      return {
        address,
        name: coin?.name ?? address,
        symbol: coin?.symbol ?? "UNKNOWN",
        balance: Number.isFinite(balance) ? balance : 0,
        balanceUsd: Number.isFinite(balanceUsd) ? balanceUsd : 0,
      };
    })
    .filter(Boolean);
}

export async function fetchCoinSwaps(address, first = 20) {
  const payload = await apiGet("/coinSwaps", {
    address,
    chain: 8453,
    first,
  });

  const swapActivities = payload?.zora20Token?.swapActivities;
  const swaps = (swapActivities?.edges ?? []).map((edge) => ({
    id: edge?.node?.id,
    coinAddress: address,
    senderAddress: edge?.node?.senderAddress,
    recipientAddress: edge?.node?.recipientAddress,
    transactionHash: edge?.node?.transactionHash,
    blockTimestamp: edge?.node?.blockTimestamp,
    activityType: edge?.node?.activityType,
    coinAmount: Number(edge?.node?.coinAmount || 0),
    quoteAmount: Number(
      edge?.node?.currencyAmountWithPrice?.currencyAmount?.amountDecimal || 0,
    ),
    quoteCurrencyAddress:
      edge?.node?.currencyAmountWithPrice?.currencyAmount?.currencyAddress,
    quotePriceUsdc: edge?.node?.currencyAmountWithPrice?.priceUsdc,
  }));

  return {
    count: swapActivities?.count ?? swaps.length,
    pageInfo: {
      endCursor: swapActivities?.pageInfo?.endCursor,
      hasNextPage: Boolean(swapActivities?.pageInfo?.hasNextPage),
    },
    swaps,
  };
}

export async function fetchTraderLeaderboard(first = 3) {
  const payload = await apiGet("/traderLeaderboard", { first });
  const currentEdges = payload?.exploreTraderLeaderboard?.edges;
  const legacyEdges = payload?.traderLeaderboard?.edges;
  const edges = currentEdges ?? legacyEdges ?? [];

  return edges
    .map((edge) => {
      const node = edge?.node;
      const handle = node?.traderProfile?.handle ?? node?.displayName;
      const identifier =
        normalizeWalletAddress(handle) ??
        (typeof handle === "string" ? handle : undefined);

      if (!identifier) return null;

      return {
        identifier,
        displayName: handle,
        profileId: node?.traderProfile?.id ?? node?.profileId,
        score: Number(node?.score || 0),
        volume: Number(node?.weekVolumeUsd ?? node?.volume ?? 0),
      };
    })
    .filter(Boolean);
}
