import { NextRequest, NextResponse } from "next/server";
import { fetchCoins, type SortOption } from "@/lib/zora";

const VALID_SORTS: SortOption[] = [
  "trending", "mcap", "new", "volume", "gainers", "creators", "featured",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") ?? "trending";
  const count = Math.min(Math.max(parseInt(searchParams.get("count") ?? "10"), 1), 20);

  if (!VALID_SORTS.includes(sort as SortOption)) {
    return NextResponse.json(
      { error: `Invalid sort. Use: ${VALID_SORTS.join(", ")}` },
      { status: 400 }
    );
  }

  const coins = await fetchCoins(sort as SortOption, count);
  return NextResponse.json({ coins, sort, count });
}
