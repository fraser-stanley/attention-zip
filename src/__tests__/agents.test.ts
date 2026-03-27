import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const TEST_BASE_URL = "https://example.com";
const TEST_WALLET = "0x1234567890123456789012345678901234567890";

type StoredValue = {
  ex?: number;
  value: unknown;
};

const store = new Map<string, StoredValue>();
let redisConfigured = true;

const fakeRedis = {
  async get<T>(key: string) {
    return (store.get(key)?.value as T | undefined) ?? null;
  },
  async set(key: string, value: unknown, options?: { ex?: number }) {
    store.set(key, {
      ex: options?.ex,
      value,
    });
    return "OK";
  },
  async del(key: string) {
    const existed = store.delete(key);
    return existed ? 1 : 0;
  },
};

vi.mock("@/lib/redis", () => ({
  getRedis: () => (redisConfigured ? fakeRedis : null),
  isRedisConfigured: () => redisConfigured,
}));

import { validateAgentKey } from "@/lib/agent-auth";
import {
  claimAgent,
  createAgentRegistration,
  getAgentByClaimCode,
  getAgentById,
  getAgentClaimLookup,
  normalizeClaimCode,
} from "@/lib/agents";
import { POST as postAgentsRegister } from "@/app/api/agents/register/route";
import { GET as getAgentsMe } from "@/app/api/agents/me/route";
import { POST as postAgentsClaim } from "@/app/api/agents/claim/route";

describe("agents", () => {
  beforeEach(() => {
    store.clear();
    redisConfigured = true;
  });

  it("normalizes claim codes to word-AB12 format", () => {
    expect(normalizeClaimCode(" Reef-x4b2 ")).toBe("reef-X4B2");
    expect(normalizeClaimCode("reef-X4B2")).toBe("reef-X4B2");
    expect(normalizeClaimCode("reef-12")).toBeNull();
  });

  it("creates agent registrations with API key and claim URL data", async () => {
    const created = await createAgentRegistration({
      name: "reef-scout",
      description: "  Tracks market moves.  ",
      runtime: "  claude-code  ",
      siteUrl: TEST_BASE_URL,
    });

    expect(created.agentId).toMatch(/^agent_[a-f0-9]{16}$/);
    expect(created.apiKey).toMatch(/^sk_zora_[a-f0-9]{32}$/);
    expect(created.keyPrefix).toHaveLength(8);
    expect(created.apiKey.startsWith(`sk_zora_${created.keyPrefix}`)).toBe(true);
    expect(created.claimCode).toMatch(/^[a-z]+-[A-Z0-9]{4}$/);
    expect(created.claimUrl).toBe(`${TEST_BASE_URL}/claim/${created.claimCode}`);
    expect(store.get(`claim:${created.claimCode}`)?.ex).toBe(604800);

    await expect(getAgentById(created.agentId)).resolves.toMatchObject({
      name: "reef-scout",
      description: "Tracks market moves.",
      runtime: "claude-code",
      status: "unclaimed",
      wallet: null,
    });
  });

  it("validates bearer API keys and rejects bad ones", async () => {
    const created = await createAgentRegistration({
      name: "signal-bot",
      siteUrl: TEST_BASE_URL,
    });

    await expect(
      validateAgentKey(
        new Request(`${TEST_BASE_URL}/api/agents/me`, {
          headers: {
            Authorization: `Bearer ${created.apiKey}`,
          },
        }),
      ),
    ).resolves.toMatchObject({
      agentId: created.agentId,
      name: "signal-bot",
    });

    await expect(
      validateAgentKey(
        new Request(`${TEST_BASE_URL}/api/agents/me`, {
          headers: {
            Authorization: `Bearer ${created.apiKey}ff`,
          },
        }),
      ),
    ).resolves.toBeNull();
  });

  it("claims an agent, leaves the claim lookup resolvable, and rejects duplicate claims", async () => {
    const created = await createAgentRegistration({
      name: "lagoon-bot",
      siteUrl: TEST_BASE_URL,
    });

    const firstResponse = await postAgentsClaim(
      new NextRequest(`${TEST_BASE_URL}/api/agents/claim`, {
        method: "POST",
        body: JSON.stringify({
          claim_code: created.claimCode,
          wallet: TEST_WALLET,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toMatchObject({
      ok: true,
      agent_id: created.agentId,
      wallet: TEST_WALLET,
    });

    expect(store.get(`claim:${created.claimCode}`)?.ex).toBeUndefined();
    await expect(getAgentClaimLookup(created.claimCode)).resolves.toBe("claimed");
    await expect(getAgentByClaimCode(created.claimCode)).resolves.toMatchObject({
      agentId: created.agentId,
      status: "active",
      wallet: TEST_WALLET,
    });

    const duplicateResponse = await postAgentsClaim(
      new NextRequest(`${TEST_BASE_URL}/api/agents/claim`, {
        method: "POST",
        body: JSON.stringify({
          claim_code: created.claimCode,
          wallet: TEST_WALLET,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(duplicateResponse.status).toBe(409);
    await expect(duplicateResponse.json()).resolves.toMatchObject({
      error: "This agent has already been claimed.",
    });
  });

  it("returns 503 from register when Redis is not configured", async () => {
    redisConfigured = false;

    const response = await postAgentsRegister(
      new NextRequest(`${TEST_BASE_URL}/api/agents/register`, {
        method: "POST",
        body: JSON.stringify({ name: "reef-scout" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "Agent registration is not configured.",
    });
  });

  it("returns 400 for malformed claim codes and 404 for missing valid claim codes", async () => {
    const malformedResponse = await postAgentsClaim(
      new NextRequest(`${TEST_BASE_URL}/api/agents/claim`, {
        method: "POST",
        body: JSON.stringify({
          claim_code: "reef-12",
          wallet: TEST_WALLET,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(malformedResponse.status).toBe(400);

    const missingResponse = await postAgentsClaim(
      new NextRequest(`${TEST_BASE_URL}/api/agents/claim`, {
        method: "POST",
        body: JSON.stringify({
          claim_code: "reef-X4B2",
          wallet: TEST_WALLET,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(missingResponse.status).toBe(404);
  });

  it("/api/agents/me returns active status after claim", async () => {
    const created = await createAgentRegistration({
      name: "cinder-bot",
      siteUrl: TEST_BASE_URL,
    });

    await claimAgent({
      claimCode: created.claimCode,
      wallet: TEST_WALLET,
    });

    const response = await getAgentsMe(
      new NextRequest(`${TEST_BASE_URL}/api/agents/me`, {
        headers: {
          Authorization: `Bearer ${created.apiKey}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      agent_id: created.agentId,
      name: "cinder-bot",
      status: "active",
      wallet: TEST_WALLET,
      claim_url: `${TEST_BASE_URL}/claim/${created.claimCode}`,
    });
  });
});
