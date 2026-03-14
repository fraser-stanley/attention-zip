import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard } from "@/lib/zora";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const count = Math.min(Math.max(parseInt(searchParams.get("count") ?? "20"), 1), 50);

  const traders = await fetchLeaderboard(count);
  return NextResponse.json({ traders });
}
