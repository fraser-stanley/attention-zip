import { NextRequest, NextResponse } from "next/server";
import {
  AGENT_CLAIM_RATE_LIMIT,
  enforceAgentRateLimit,
} from "@/lib/agent-rate-limit";
import {
  AgentInputError,
  claimAgent,
  getAgentClaimLookup,
  normalizeClaimCode,
} from "@/lib/agents";
import { isRedisConfigured } from "@/lib/redis";
import { normalizeWalletAddress } from "@/lib/wallet-address";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function serviceUnavailable() {
  return NextResponse.json(
    { error: "Agent claiming is not configured." },
    {
      status: 503,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return serviceUnavailable();
  }

  const rateLimit = await enforceAgentRateLimit(request, AGENT_CLAIM_RATE_LIMIT);

  if (rateLimit.response) {
    return rateLimit.response;
  }

  const responseHeaders = {
    ...NO_STORE_HEADERS,
    ...rateLimit.headers,
  };

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  const payload = body as Record<string, unknown>;
  const claimCode =
    typeof payload.claim_code === "string" ? normalizeClaimCode(payload.claim_code) : null;
  const wallet =
    typeof payload.wallet === "string" ? normalizeWalletAddress(payload.wallet) : null;

  if (!claimCode) {
    return NextResponse.json(
      { error: "claim_code must match word-AB12." },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  if (!wallet) {
    return NextResponse.json(
      { error: "wallet must be a valid 0x address." },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  const claimLookup = await getAgentClaimLookup(claimCode);

  if (claimLookup === "missing") {
    return NextResponse.json(
      { error: "Invalid or expired claim link." },
      {
        status: 404,
        headers: responseHeaders,
      },
    );
  }

  if (claimLookup === "claimed") {
    return NextResponse.json(
      { error: "This agent has already been claimed." },
      {
        status: 409,
        headers: responseHeaders,
      },
    );
  }

  if (claimLookup === "suspended") {
    return NextResponse.json(
      { error: "This agent is unavailable." },
      {
        status: 409,
        headers: responseHeaders,
      },
    );
  }

  try {
    const agent = await claimAgent({ claimCode, wallet });

    if (!agent || !agent.wallet) {
      return NextResponse.json(
        { error: "Invalid or expired claim link." },
        {
          status: 404,
          headers: responseHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        agent_id: agent.agentId,
        wallet: agent.wallet,
      },
      {
        headers: responseHeaders,
      },
    );
  } catch (error) {
    if (error instanceof AgentInputError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 400,
          headers: responseHeaders,
        },
      );
    }

    return NextResponse.json(
      { error: "Failed to claim agent." },
      {
        status: 500,
        headers: responseHeaders,
      },
    );
  }
}
