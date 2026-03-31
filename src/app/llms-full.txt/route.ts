import { NextRequest, NextResponse } from "next/server";
import { buildLlmsFullTxt } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export function GET(request: NextRequest) {
  const siteUrl = getSiteUrl(request.url);

  return new NextResponse(buildLlmsFullTxt(siteUrl), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
