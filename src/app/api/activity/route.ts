import { NextRequest, NextResponse } from "next/server";
import { getActivityFeedData } from "@/lib/data";
import { type ActivityApiResponse } from "@/lib/zora";

const CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=60";

export async function GET(request: NextRequest) {
  const requestedCount = Number.parseInt(
    request.nextUrl.searchParams.get("count") ?? "6",
    10,
  );
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 1), 12)
    : 6;

  try {
    const items = await getActivityFeedData(count);
    const response: ActivityApiResponse = {
      items,
      count: items.length,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load activity feed." },
      {
        status: 502,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }
}
