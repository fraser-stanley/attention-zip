import { afterEach, describe, expect, it, vi } from "vitest";

type CoinsSdkModule = Record<string, ReturnType<typeof vi.fn>>;

function mockCoinsSdk(overrides: Partial<CoinsSdkModule> = {}) {
  const sdkModule: CoinsSdkModule = {
    setApiKey: vi.fn(),
    getCoinsTopGainers: vi.fn(async () => ({})),
    getCoinsMostValuable: vi.fn(async () => ({})),
    getCoinsNew: vi.fn(async () => ({})),
    getCoinsTopVolume24h: vi.fn(async () => ({})),
    getCreatorCoins: vi.fn(async () => ({})),
    getFeaturedCreators: vi.fn(async () => ({})),
    getTrendingAll: vi.fn(async () => ({})),
    getTraderLeaderboard: vi.fn(async () => ({})),
    getCoinsLastTraded: vi.fn(async () => ({})),
    getCoinsLastTradedUnique: vi.fn(async () => ({})),
    getCoinSwaps: vi.fn(async () => ({})),
    getProfile: vi.fn(async () => ({})),
    getProfileBalances: vi.fn(async () => ({})),
    ...overrides,
  };

  vi.doMock("@zoralabs/coins-sdk", () => sdkModule);
  return sdkModule;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("fetchProfile", () => {
  it("resolves a handle into a canonical wallet identity", async () => {
    const sdk = mockCoinsSdk({
      getProfile: vi.fn(async () => ({
        data: {
          profile: {
            id: "profile_jacob",
            handle: "jacob",
            publicWallet: {
              walletAddress: "0x1234567890123456789012345678901234567890",
            },
            linkedWallets: {
              edges: [
                {
                  node: {
                    walletAddress:
                      "0x1234567890123456789012345678901234567890",
                    walletType: "EOA",
                  },
                },
              ],
            },
            avatar: {
              previewImage: {
                medium: "https://example.com/jacob-medium.png",
                small: "https://example.com/jacob-small.png",
              },
            },
          },
        },
      })),
    });

    const { fetchProfile } = await import("@/lib/zora");
    const profile = await fetchProfile("jacob");

    expect(sdk.getProfile).toHaveBeenCalledWith({ identifier: "jacob" });
    expect(profile).toEqual({
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
        medium: "https://example.com/jacob-medium.png",
        small: "https://example.com/jacob-small.png",
      },
    });
  });

  it("keeps a wallet identifier stable even if only linked wallets are present", async () => {
    const wallet =
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const sdk = mockCoinsSdk({
      getProfile: vi.fn(async () => ({
        data: {
          profile: {
            id: "profile_wallet",
            handle: "wallet-handle",
            linkedWallets: {
              edges: [
                {
                  node: {
                    walletAddress: wallet,
                    walletType: "EOA",
                  },
                },
              ],
            },
          },
        },
      })),
    });

    const { fetchProfile } = await import("@/lib/zora");
    const profile = await fetchProfile(wallet);

    expect(sdk.getProfile).toHaveBeenCalledWith({ identifier: wallet });
    expect(profile?.walletAddress).toBe(wallet);
    expect(profile?.linkedWallets).toEqual([
      {
        walletAddress: wallet,
        walletType: "EOA",
      },
    ]);
  });
});

describe("fetchCoinSwaps", () => {
  it("normalizes swap activity, quote notional, and pagination", async () => {
    const sdk = mockCoinsSdk({
      getCoinSwaps: vi.fn(async () => ({
        data: {
          zora20Token: {
            swapActivities: {
              count: 2,
              pageInfo: {
                endCursor: "cursor_2",
                hasNextPage: true,
              },
              edges: [
                {
                  node: {
                    id: "swap_1",
                    senderAddress:
                      "0x1111111111111111111111111111111111111111",
                    recipientAddress:
                      "0x2222222222222222222222222222222222222222",
                    transactionHash: "0xswap1",
                    blockTimestamp: "2026-03-27T12:00:00.000Z",
                    activityType: "BUY",
                    coinAmount: "1500",
                    senderProfile: {
                      handle: "jacob",
                    },
                    currencyAmountWithPrice: {
                      priceUsdc: "1",
                      currencyAmount: {
                        currencyAddress:
                          "0x3333333333333333333333333333333333333333",
                        amountDecimal: 84.25,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      })),
    });

    const { fetchCoinSwaps } = await import("@/lib/zora");
    const response = await fetchCoinSwaps(
      "0x4444444444444444444444444444444444444444",
      10,
      "cursor_1",
    );

    expect(sdk.getCoinSwaps).toHaveBeenCalledWith({
      address: "0x4444444444444444444444444444444444444444",
      chain: 8453,
      first: 10,
      after: "cursor_1",
    });
    expect(response).toEqual({
      coinAddress: "0x4444444444444444444444444444444444444444",
      count: 2,
      pageInfo: {
        endCursor: "cursor_2",
        hasNextPage: true,
      },
      swaps: [
        {
          id: "swap_1",
          coinAddress: "0x4444444444444444444444444444444444444444",
          senderAddress: "0x1111111111111111111111111111111111111111",
          recipientAddress: "0x2222222222222222222222222222222222222222",
          transactionHash: "0xswap1",
          blockTimestamp: "2026-03-27T12:00:00.000Z",
          activityType: "BUY",
          coinAmount: "1500",
          quoteAmount: 84.25,
          quoteCurrencyAddress: "0x3333333333333333333333333333333333333333",
          quotePriceUsdc: "1",
          senderProfileHandle: "jacob",
        },
      ],
    });
  });
});
