import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("/api/profile", () => {
  it("requires a non-empty identifier", async () => {
    const { GET } = await import("@/app/api/profile/route");
    const response = await GET(
      new NextRequest("https://example.com/api/profile"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("A non-empty identifier is required.");
  });

  it("serializes the normalized profile payload", async () => {
    const fetchProfile = vi.fn(async () => ({
      identifier: "jacob",
      handle: "jacob",
      walletAddress: "0x1234567890123456789012345678901234567890",
      linkedWallets: [
        {
          walletAddress: "0x1234567890123456789012345678901234567890",
          walletType: "EOA",
        },
      ],
      profileId: "profile_jacob",
      avatar: {
        medium: "https://example.com/avatar-medium.png",
        small: "https://example.com/avatar-small.png",
      },
    }));
    vi.doMock("@/lib/zora", () => ({
      fetchProfile,
    }));

    const { GET } = await import("@/app/api/profile/route");
    const response = await GET(
      new NextRequest("https://example.com/api/profile?identifier=jacob"),
    );
    const data = await response.json();

    expect(fetchProfile).toHaveBeenCalledWith("jacob");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    expect(data.profile.walletAddress).toBe(
      "0x1234567890123456789012345678901234567890",
    );
    expect(data.profile.handle).toBe("jacob");
  });
});

describe("/api/coin-swaps", () => {
  it("requires a valid coin address", async () => {
    const { GET } = await import("@/app/api/coin-swaps/route");
    const response = await GET(
      new NextRequest("https://example.com/api/coin-swaps?address=not-a-wallet"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("A valid 0x coin address is required.");
  });

  it("clamps count and serializes swap activity with pageInfo", async () => {
    const fetchCoinSwaps = vi.fn(async () => ({
      coinAddress: "0x4444444444444444444444444444444444444444",
      count: 1,
      pageInfo: {
        endCursor: "cursor_2",
        hasNextPage: false,
      },
      swaps: [
        {
          id: "swap_1",
          coinAddress: "0x4444444444444444444444444444444444444444",
          activityType: "BUY",
          transactionHash: "0xswap1",
        },
      ],
    }));
    vi.doMock("@/lib/zora", () => ({
      fetchCoinSwaps,
    }));

    const { GET } = await import("@/app/api/coin-swaps/route");
    const response = await GET(
      new NextRequest(
        "https://example.com/api/coin-swaps?address=0x4444444444444444444444444444444444444444&count=99&after=cursor_1",
      ),
    );
    const data = await response.json();

    expect(fetchCoinSwaps).toHaveBeenCalledWith(
      "0x4444444444444444444444444444444444444444",
      50,
      "cursor_1",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=30, stale-while-revalidate=60",
    );
    expect(data.pageInfo).toEqual({
      endCursor: "cursor_2",
      hasNextPage: false,
    });
    expect(data.swaps[0].transactionHash).toBe("0xswap1");
  });
});
