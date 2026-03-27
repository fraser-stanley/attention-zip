import { describe, expect, it } from "vitest";
import {
  isWalletAddress,
  normalizeWalletAddress,
} from "@/lib/wallet-address";

describe("wallet address helpers", () => {
  it("accepts a valid 0x address", () => {
    const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    expect(isWalletAddress(address)).toBe(true);
    expect(normalizeWalletAddress(address)).toBe(address);
  });

  it("trims surrounding whitespace", () => {
    expect(
      normalizeWalletAddress("  0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  "),
    ).toBe("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  });

  it("rejects malformed values", () => {
    expect(isWalletAddress("0xabc")).toBe(false);
    expect(normalizeWalletAddress("not-an-address")).toBeNull();
    expect(normalizeWalletAddress(undefined)).toBeNull();
  });
});
