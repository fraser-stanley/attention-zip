import { describe, expect, it } from "vitest";
import { isWalletSession } from "@/lib/wallet-session";

const VALID_SESSION = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  source: "zora-cli" as const,
  connectedAt: "2026-03-25T14:00:00.000Z",
};

describe("isWalletSession", () => {
  it("returns true for a valid session", () => {
    expect(isWalletSession(VALID_SESSION)).toBe(true);
  });

  it("returns true for a lowercase address", () => {
    expect(
      isWalletSession({
        ...VALID_SESSION,
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      }),
    ).toBe(true);
  });

  it("returns false when address is missing", () => {
    const { address: omittedAddress, ...rest } = VALID_SESSION;
    void omittedAddress;
    expect(isWalletSession(rest)).toBe(false);
  });

  it("returns false for address without 0x prefix", () => {
    expect(
      isWalletSession({
        ...VALID_SESSION,
        address: "d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      }),
    ).toBe(false);
  });

  it("returns false for address with wrong length", () => {
    expect(
      isWalletSession({ ...VALID_SESSION, address: "0xabc" }),
    ).toBe(false);
  });

  it("returns false for wrong source value", () => {
    expect(
      isWalletSession({ ...VALID_SESSION, source: "metamask" }),
    ).toBe(false);
  });

  it("returns false when connectedAt is missing", () => {
    const { connectedAt: omittedConnectedAt, ...rest } = VALID_SESSION;
    void omittedConnectedAt;
    expect(isWalletSession(rest)).toBe(false);
  });

  it("returns false for invalid connectedAt date string", () => {
    expect(
      isWalletSession({ ...VALID_SESSION, connectedAt: "not-a-date" }),
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isWalletSession(null)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isWalletSession("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isWalletSession(42)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isWalletSession(undefined)).toBe(false);
  });
});
