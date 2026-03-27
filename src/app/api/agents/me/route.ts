import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { buildClaimUrl } from "@/lib/agents";
import { isRedisConfigured } from "@/lib/redis";
import { getSiteUrl } from "@/lib/site";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function serviceUnavailable() {
  return NextResponse.json(
    { error: "Agent registration is not configured." },
    {
      status: 503,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function GET(request: NextRequest) {
  if (!isRedisConfigured()) {
    return serviceUnavailable();
  }

  const agent = await validateAgentKey(request);

  if (!agent) {
    return NextResponse.json(
      { error: "Invalid agent API key." },
      {
        status: 401,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  return NextResponse.json(
    {
      agent_id: agent.agentId,
      name: agent.name,
      status: agent.status,
      wallet: agent.wallet ?? undefined,
      claim_url: buildClaimUrl(agent.claimCode, getSiteUrl(request.url)),
      created_at: agent.createdAt,
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}
