import { NextRequest, NextResponse } from "next/server";
import { fetchProfile } from "@/lib/zora";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();

  if (!identifier) {
    return NextResponse.json(
      { error: "A non-empty identifier is required." },
      {
        status: 400,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  try {
    const profile = await fetchProfile(identifier);

    return NextResponse.json(
      { profile },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load profile data." },
      {
        status: 502,
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }
}
