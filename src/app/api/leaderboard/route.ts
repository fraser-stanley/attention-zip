import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/data";
import { type LeaderboardApiResponse } from "@/lib/zora";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const count = Math.min(
    Math.max(parseInt(searchParams.get("count") ?? "20"), 1),
    50
  );

  const response: LeaderboardApiResponse = {
    traders: await getLeaderboardData(count),
    count,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
