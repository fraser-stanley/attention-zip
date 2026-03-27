import { NextRequest, NextResponse } from "next/server";
import { normalizeWalletAddress } from "@/lib/wallet-address";
import {
  fetchProfileBalances,
  type PortfolioApiResponse,
} from "@/lib/zora";

const CACHE_CONTROL = "public, s-maxage=15, stale-while-revalidate=30";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");
  const requestedCount = Number.parseInt(searchParams.get("count") ?? "20", 10);
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 1), 50)
    : 20;

  const normalizedAddress = normalizeWalletAddress(address);

  if (!normalizedAddress) {
    return NextResponse.json(
      { error: "A valid 0x wallet address is required." },
      {
        status: 400,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  try {
    const response: PortfolioApiResponse = {
      address: normalizedAddress,
      balances: await fetchProfileBalances(normalizedAddress, count),
      count,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load portfolio data." },
      {
        status: 502,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }
}
