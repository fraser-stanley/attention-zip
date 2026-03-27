import { NextRequest, NextResponse } from "next/server";
import {
  API_VERSION,
  SITE_DESCRIPTION,
  SITE_NAME,
  getDocumentationUrl,
  getSiteRepoUrl,
} from "@/lib/site";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      name: `${SITE_NAME} API`,
      version: API_VERSION,
      description: SITE_DESCRIPTION,
      documentation: getDocumentationUrl(request.url),
      sourceRepository: getSiteRepoUrl(),
      endpoints: {
        index: {
          url: "/api",
          description: "API discovery document for agents and integrations.",
        },
        skills: {
          url: "/api/skills",
          description: "Skill catalog with install commands and metadata.",
          params: {
            id: "Optional skill id, for example `trend-scout`.",
          },
        },
        explore: {
          url: "/api/explore",
          description: "Live coin data grouped by sort type.",
          params: {
            sort: "trending|mcap|new|volume|gainers|creators|featured",
            count: "1-20",
          },
        },
        leaderboard: {
          url: "/api/leaderboard",
          description: "Weekly trader rankings by Zora volume.",
          params: {
            count: "1-50",
          },
        },
        portfolio: {
          url: "/api/portfolio",
          description: "Public Zora coin balances for a wallet address.",
          params: {
            address: "0x wallet address",
            count: "1-50",
          },
        },
      },
    },
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    }
  );
}
