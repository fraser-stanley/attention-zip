import { NextRequest, NextResponse } from "next/server";
import { buildAiDiscovery } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export function GET(request: NextRequest) {
  const siteUrl = getSiteUrl(request.url);

  return NextResponse.json(buildAiDiscovery(siteUrl), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
