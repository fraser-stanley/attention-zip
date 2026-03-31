import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const RATE_LIMIT_KEY_PREFIX = "ratelimit:agents";

export const AGENT_REGISTER_RATE_LIMIT = {
  errorMessage: "Too many agent registrations from this IP. Please try again later.",
  key: "register",
  limit: 5,
  windowSeconds: 60 * 10,
} as const;

export const AGENT_CLAIM_RATE_LIMIT = {
  errorMessage: "Too many claim attempts from this IP. Please try again later.",
  key: "claim",
  limit: 10,
  windowSeconds: 60 * 10,
} as const;

export type AgentRateLimitConfig = {
  errorMessage: string;
  key: string;
  limit: number;
  windowSeconds: number;
};

export type AgentRateLimitResult = {
  headers: Record<string, string>;
  response: NextResponse | null;
};

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  if (firstForwardedIp) {
    return firstForwardedIp.toLowerCase();
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp.toLowerCase();
  }

  return "unknown";
}

function buildHeaders({
  limit,
  nowSeconds,
  remaining,
  retryAfterSeconds,
}: {
  limit: number;
  nowSeconds: number;
  remaining: number;
  retryAfterSeconds: number;
}) {
  return {
    "Cache-Control": "no-store",
    "Retry-After": String(retryAfterSeconds),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(nowSeconds + retryAfterSeconds),
  };
}

export async function enforceAgentRateLimit(
  request: NextRequest,
  config: AgentRateLimitConfig,
): Promise<AgentRateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    return {
      headers: {},
      response: null,
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowOffset = nowSeconds % config.windowSeconds;
  const retryAfterSeconds = config.windowSeconds - windowOffset || config.windowSeconds;
  const windowBucket = Math.floor(nowSeconds / config.windowSeconds);
  const clientIdentifier = encodeURIComponent(getClientIdentifier(request));
  const rateLimitKey = [
    RATE_LIMIT_KEY_PREFIX,
    config.key,
    clientIdentifier,
    String(windowBucket),
  ].join(":");

  const count = await redis.incr(rateLimitKey);

  if (count === 1) {
    await redis.expire(rateLimitKey, config.windowSeconds);
  }

  const headers = buildHeaders({
    limit: config.limit,
    nowSeconds,
    remaining: Math.max(config.limit - count, 0),
    retryAfterSeconds,
  });

  if (count > config.limit) {
    return {
      headers,
      response: NextResponse.json(
        { error: config.errorMessage },
        {
          status: 429,
          headers,
        },
      ),
    };
  }

  return {
    headers,
    response: null,
  };
}
