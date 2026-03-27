"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  PortfolioApiResponse,
  ProfileBalance,
} from "@/lib/zora";

const TOKEN_DECIMALS = 1e18;

export interface PortfolioPosition {
  address: string;
  balance: number;
  balanceUsd: number;
  changePct24h: number | null;
  changeUsd24h: number | null;
  coinType: string | null;
  imageUrl: string | null;
  marketCap: number | null;
  marketCapDelta24h: number | null;
  name: string;
  priceUsd: number | null;
  symbol: string | null;
}

export interface PortfolioSummary {
  positionCount: number;
  totalChangePct24h: number | null;
  totalChangeUsd24h: number | null;
  totalValueUsd: number;
}

const EMPTY_SUMMARY: PortfolioSummary = {
  positionCount: 0,
  totalChangePct24h: null,
  totalChangeUsd24h: null,
  totalValueUsd: 0,
};

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTokenAmount(rawBalance: string | undefined): number {
  const parsed = parseNumber(rawBalance);
  if (parsed === null) return 0;
  return parsed / TOKEN_DECIMALS;
}

function getPriceUsd(balance: ProfileBalance): number | null {
  const priceFromQuote = parseNumber(balance.coin?.tokenPrice?.priceInUsdc);
  if (priceFromQuote !== null) return priceFromQuote;

  const marketCap = parseNumber(balance.coin?.marketCap);
  const totalSupply = parseNumber(balance.coin?.totalSupply);
  if (marketCap === null || totalSupply === null || totalSupply === 0) return null;

  return marketCap / totalSupply;
}

function toPosition(balance: ProfileBalance, index: number): PortfolioPosition {
  const amount = toTokenAmount(balance.balance);
  const priceUsd = getPriceUsd(balance);
  const marketCap = parseNumber(balance.coin?.marketCap);
  const marketCapDelta24h = parseNumber(balance.coin?.marketCapDelta24h);
  const valueUsd = balance.balanceUsd
    ? parseNumber(balance.balanceUsd) ?? 0
    : priceUsd === null
      ? 0
      : amount * priceUsd;

  const changeUsd24h =
    marketCap !== null &&
    marketCap !== 0 &&
    marketCapDelta24h !== null
      ? valueUsd * (marketCapDelta24h / marketCap)
      : null;

  const previousValueUsd =
    changeUsd24h === null ? null : valueUsd - changeUsd24h;
  const changePct24h =
    previousValueUsd !== null && previousValueUsd !== 0 && changeUsd24h !== null
      ? (changeUsd24h / previousValueUsd) * 100
      : null;

  return {
    address: balance.coin?.address ?? `position-${index}`,
    balance: amount,
    balanceUsd: valueUsd,
    changePct24h,
    changeUsd24h,
    coinType: balance.coin?.coinType ?? null,
    imageUrl: balance.coin?.mediaContent?.previewImage?.medium ?? null,
    marketCap,
    marketCapDelta24h,
    name: balance.coin?.name ?? "Unknown coin",
    priceUsd,
    symbol: balance.coin?.symbol ?? null,
  };
}

function summarizePositions(positions: PortfolioPosition[]): PortfolioSummary {
  if (positions.length === 0) return EMPTY_SUMMARY;

  const totalValueUsd = positions.reduce((sum, position) => sum + position.balanceUsd, 0);
  const trackedPositions = positions.filter((position) => position.changeUsd24h !== null);
  const trackedValueUsd = trackedPositions.reduce((sum, position) => sum + position.balanceUsd, 0);
  const totalChangeUsd24h =
    trackedPositions.length > 0
      ? trackedPositions.reduce((sum, position) => sum + (position.changeUsd24h ?? 0), 0)
      : null;
  const previousTrackedValueUsd =
    totalChangeUsd24h === null ? null : trackedValueUsd - totalChangeUsd24h;
  const totalChangePct24h =
    previousTrackedValueUsd !== null &&
    previousTrackedValueUsd !== 0 &&
    totalChangeUsd24h !== null
      ? (totalChangeUsd24h / previousTrackedValueUsd) * 100
      : null;

  return {
    positionCount: positions.length,
    totalChangePct24h,
    totalChangeUsd24h,
    totalValueUsd,
  };
}

export function usePortfolioData(address: string | null) {
  const query = useQuery<PortfolioApiResponse, Error>({
    enabled: Boolean(address),
    queryKey: ["portfolio", address],
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await fetch(`/api/portfolio?address=${address}&count=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio data.");
      }
      return response.json() as Promise<PortfolioApiResponse>;
    },
  });

  const balances = useMemo(() => query.data?.balances ?? [], [query.data?.balances]);
  const positions = useMemo(
    () =>
      balances
        .map((balance, index) => toPosition(balance, index))
        .filter((position) => position.balance > 0 || position.balanceUsd > 0),
    [balances],
  );
  const summary = useMemo(() => summarizePositions(positions), [positions]);

  return {
    balances,
    positions,
    summary,
    isLoading: Boolean(address) && query.isLoading,
    error: query.error ?? null,
  };
}
