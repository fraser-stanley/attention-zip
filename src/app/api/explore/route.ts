import { NextRequest, NextResponse } from "next/server";
import { getExploreData } from "@/lib/data";
import { type ExploreApiResponse, type SortOption } from "@/lib/zora";

const VALID_SORTS: SortOption[] = [
  "trending", "mcap", "new", "volume", "gainers", "creators", "trends", "featured",
  "last-traded", "last-traded-unique",
];
const CACHE_CONTROL = "public, s-maxage=15, stale-while-revalidate=30";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") ?? "trending";
  const count = Math.min(
    Math.max(parseInt(searchParams.get("count") ?? "10"), 1),
    20
  );

  if (!VALID_SORTS.includes(sort as SortOption)) {
    return NextResponse.json(
      { error: `Invalid sort. Use: ${VALID_SORTS.join(", ")}` },
      {
        status: 400,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      }
    );
  }

  const response: ExploreApiResponse = {
    coins: await getExploreData(sort as SortOption, count),
    sort: sort as SortOption,
    count,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
