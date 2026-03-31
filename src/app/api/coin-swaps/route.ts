import { NextRequest, NextResponse } from "next/server";
import { normalizeWalletAddress } from "@/lib/wallet-address";
import { fetchCoinSwaps } from "@/lib/zora";

const CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=60";

export async function GET(request: NextRequest) {
  const address = normalizeWalletAddress(
    request.nextUrl.searchParams.get("address"),
  );
  const requestedCount = Number.parseInt(
    request.nextUrl.searchParams.get("count") ?? "20",
    10,
  );
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 1), 50)
    : 20;
  const after = request.nextUrl.searchParams.get("after")?.trim();

  if (!address) {
    return NextResponse.json(
      { error: "A valid 0x coin address is required." },
      {
        status: 400,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  try {
    const response = await fetchCoinSwaps(address, count, after || undefined);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load coin swap activity." },
      {
        status: 502,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }
}
