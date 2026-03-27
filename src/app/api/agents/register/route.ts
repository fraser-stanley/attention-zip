import { NextRequest, NextResponse } from "next/server";
import {
  AGENT_REGISTER_RATE_LIMIT,
  enforceAgentRateLimit,
} from "@/lib/agent-rate-limit";
import { AgentInputError, createAgentRegistration } from "@/lib/agents";
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

export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return serviceUnavailable();
  }

  const rateLimit = await enforceAgentRateLimit(request, AGENT_REGISTER_RATE_LIMIT);

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

  try {
    const agent = await createAgentRegistration({
      description: payload.description,
      name: payload.name,
      runtime: payload.runtime,
      siteUrl: getSiteUrl(request.url),
    });

    return NextResponse.json(
      {
        agent_id: agent.agentId,
        api_key: agent.apiKey,
        key_prefix: agent.keyPrefix,
        claim_url: agent.claimUrl,
        claim_code: agent.claimCode,
        status: agent.status,
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
      { error: "Failed to register agent." },
      {
        status: 500,
        headers: responseHeaders,
      },
    );
  }
}
