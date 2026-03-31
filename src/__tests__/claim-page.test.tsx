import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const TEST_WALLET = "0x1234567890123456789012345678901234567890";

type ClaimLookup = "missing" | "available" | "claimed" | "suspended";

interface TestAgent {
  agentId: string;
  claimCode: string;
  claimedAt: string | null;
  createdAt: string;
  description: string | null;
  keyPrefix: string;
  name: string;
  runtime: string | null;
  status: "unclaimed" | "active" | "suspended";
  wallet: string | null;
}

const BASE_AGENT: TestAgent = {
  agentId: "agent_1234abcd5678ef90",
  claimCode: "reef-X4B2",
  claimedAt: null,
  createdAt: "2026-03-27T00:00:00.000Z",
  description: "Tracks market moves.",
  keyPrefix: "1234abcd",
  name: "reef-scout",
  runtime: "claude-code",
  status: "unclaimed",
  wallet: null,
};

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

async function renderClaimPage(options?: {
  agent?: TestAgent | null;
  claimLookup?: ClaimLookup;
  code?: string;
  isRedisConfigured?: boolean;
  normalizedClaimCode?: string | null;
}) {
  const {
    agent = BASE_AGENT,
    claimLookup = "available",
    code = "reef-X4B2",
    isRedisConfigured = true,
    normalizedClaimCode = code,
  } = options ?? {};

  vi.doMock("@/lib/redis", () => ({
    isRedisConfigured: () => isRedisConfigured,
  }));

  vi.doMock("@/lib/agents", () => ({
    getAgentByClaimCode: vi.fn(async () => agent),
    getAgentClaimLookup: vi.fn(async () => claimLookup),
    normalizeClaimCode: vi.fn(() => normalizedClaimCode),
  }));

  vi.doMock("@/components/claim-form", () => ({
    ClaimForm: ({ claimCode }: { claimCode: string }) => (
      <div data-claim-form={claimCode}>ClaimForm</div>
    ),
  }));

  const { default: ClaimPage } = await import("@/app/claim/[code]/page");
  const page = await ClaimPage({
    params: Promise.resolve({ code }),
  });

  return renderToStaticMarkup(page);
}

describe("/claim/[code]", () => {
  it("renders the unconfigured state when Redis is missing", async () => {
    const markup = await renderClaimPage({
      isRedisConfigured: false,
    });

    expect(markup).toContain("Claiming is not configured");
  });

  it("renders the invalid state when the claim code cannot be normalized", async () => {
    const markup = await renderClaimPage({
      normalizedClaimCode: null,
      code: "invalid-code",
    });

    expect(markup).toContain("Invalid or expired claim link");
  });

  it("renders the invalid-or-expired state when the claim lookup is missing", async () => {
    const markup = await renderClaimPage({
      claimLookup: "missing",
      agent: null,
    });

    expect(markup).toContain("Invalid or expired claim link");
  });

  it("renders the suspended state", async () => {
    const markup = await renderClaimPage({
      claimLookup: "suspended",
      agent: {
        ...BASE_AGENT,
        status: "suspended",
      },
    });

    expect(markup).toContain("This agent is unavailable");
    expect(markup).toContain("reef-scout");
  });

  it("renders the already-claimed state with a portfolio link", async () => {
    const markup = await renderClaimPage({
      claimLookup: "claimed",
      agent: {
        ...BASE_AGENT,
        claimedAt: "2026-03-27T01:00:00.000Z",
        status: "active",
        wallet: TEST_WALLET,
      },
    });

    expect(markup).toContain("Already claimed");
    expect(markup).toContain(`/portfolio/${TEST_WALLET}`);
  });

  it("renders the claimable state with the claim form", async () => {
    const markup = await renderClaimPage();

    expect(markup).toContain("Claim reef-scout");
    expect(markup).toContain("Runtime: claude-code");
    expect(markup).toContain('data-claim-form="reef-X4B2"');
  });
});
