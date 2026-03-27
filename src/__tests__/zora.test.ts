import { describe, expect, it } from "vitest";
import { extractLeaderboardTraders } from "@/lib/zora";

describe("extractLeaderboardTraders", () => {
  it("maps the current SDK leaderboard shape", () => {
    const traders = extractLeaderboardTraders({
      data: {
        exploreTraderLeaderboard: {
          edges: [
            {
              node: {
                score: 654,
                weekVolumeUsd: 7752.586073809152,
                weekTradesCount: 1773,
                traderProfile: {
                  handle: "deadburn",
                  id: "profile-1",
                },
              },
            },
          ],
        },
      },
    });

    expect(traders).toEqual([
      {
        address: undefined,
        displayName: "deadburn",
        volume: 7752.586073809152,
        tradesCount: 1773,
        score: 654,
        profileId: "profile-1",
      },
    ]);
  });

  it("supports the legacy leaderboard shape", () => {
    const traders = extractLeaderboardTraders({
      data: {
        traderLeaderboard: {
          edges: [
            {
              node: {
                address: "0x1234567890abcdef1234567890abcdef12345678",
                displayName: "legacy",
                volume: "1234",
              },
            },
          ],
        },
      },
    });

    expect(traders).toEqual([
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        displayName: "legacy",
        volume: "1234",
      },
    ]);
  });
});
