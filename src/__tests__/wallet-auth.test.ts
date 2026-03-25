import { beforeEach, describe, expect, it } from "vitest";
import { createSiweMessage } from "viem/siwe";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  WALLET_AUTH_CHAIN_ID,
  WALLET_AUTH_STATEMENT,
  WALLET_AUTH_TTL_MS,
  WALLET_AUTH_TTL_SECONDS,
  buildWalletConnectCommand,
  generateChallenge,
  resetWalletAuthForTests,
  verifyConnectToken,
} from "@/lib/wallet-auth";

const ORIGIN = "https://attentionindex.xyz";
const NOW = new Date("2026-03-25T14:00:00.000Z");
const VERIFIED_AT = new Date("2026-03-25T14:01:00.000Z");
const ACCOUNT = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945382d7c0558a9a0a4de3983c02d6b98759aa",
);

beforeEach(() => {
  resetWalletAuthForTests();
});

async function createToken({
  origin = ORIGIN,
  nonce,
  issuedAt = NOW,
  expirationTime = new Date(issuedAt.getTime() + WALLET_AUTH_TTL_MS),
  statement = WALLET_AUTH_STATEMENT,
  chainId = WALLET_AUTH_CHAIN_ID,
  encoding = "base64url",
  account = ACCOUNT,
  addressOverride,
}: {
  origin?: string;
  nonce: string;
  issuedAt?: Date;
  expirationTime?: Date;
  statement?: string;
  chainId?: number;
  encoding?: "base64" | "base64url";
  account?: ReturnType<typeof privateKeyToAccount>;
  addressOverride?: string;
}) {
  const message = createSiweMessage({
    address: account.address,
    chainId,
    domain: new URL(origin).host,
    expirationTime,
    issuedAt,
    nonce,
    statement,
    uri: origin,
    version: "1",
  });

  const signature = await account.signMessage({ message });
  return Buffer.from(
    JSON.stringify({
      message,
      signature,
      address: addressOverride ?? account.address,
    }),
  ).toString(encoding);
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("wallet auth", () => {
  it("verifies a valid SIWE token", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({ nonce: challenge.nonce });

    await expect(verifyConnectToken(token, ORIGIN, VERIFIED_AT)).resolves.toMatchObject({
      address: ACCOUNT.address,
      source: "zora-cli",
      connectedAt: VERIFIED_AT.toISOString(),
    });
  });

  it("accepts standard base64 tokens", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      encoding: "base64",
    });

    await expect(verifyConnectToken(token, ORIGIN, VERIFIED_AT)).resolves.toMatchObject({
      address: ACCOUNT.address,
    });
  });
});

// ---------------------------------------------------------------------------
// generateChallenge
// ---------------------------------------------------------------------------

describe("generateChallenge", () => {
  it("returns nonce and expiresAt with correct shape", () => {
    const challenge = generateChallenge(NOW);

    expect(typeof challenge.nonce).toBe("string");
    expect(challenge.nonce.length).toBeGreaterThanOrEqual(8);
    expect(typeof challenge.expiresAt).toBe("string");
    expect(Number.isFinite(Date.parse(challenge.expiresAt))).toBe(true);
  });

  it("sets expiresAt to TTL ahead of now", () => {
    const challenge = generateChallenge(NOW);
    const expected = new Date(NOW.getTime() + WALLET_AUTH_TTL_MS).toISOString();

    expect(challenge.expiresAt).toBe(expected);
  });

  it("produces unique nonces on successive calls", () => {
    const a = generateChallenge(NOW);
    const b = generateChallenge(NOW);

    expect(a.nonce).not.toBe(b.nonce);
  });
});

// ---------------------------------------------------------------------------
// buildWalletConnectCommand
// ---------------------------------------------------------------------------

describe("buildWalletConnectCommand", () => {
  it("returns expected command format", () => {
    const command = buildWalletConnectCommand(ORIGIN, "test-nonce-123");

    expect(command).toBe(
      `zora auth connect --origin ${ORIGIN} --nonce test-nonce-123 --expires-in ${WALLET_AUTH_TTL_SECONDS}`,
    );
  });
});

// ---------------------------------------------------------------------------
// Replay protection
// ---------------------------------------------------------------------------

describe("replay protection", () => {
  it("rejects replay after a successful verification", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({ nonce: challenge.nonce });

    await verifyConnectToken(token, ORIGIN, VERIFIED_AT);

    await expect(verifyConnectToken(token, ORIGIN, VERIFIED_AT)).rejects.toMatchObject({
      code: "challenge_expired",
      status: 410,
    });
  });

  it("rejects expired challenges", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({ nonce: challenge.nonce });

    await expect(
      verifyConnectToken(
        token,
        ORIGIN,
        new Date(NOW.getTime() + WALLET_AUTH_TTL_MS + 1_000),
      ),
    ).rejects.toMatchObject({
      code: "challenge_expired",
      status: 410,
    });
  });

  it("rejects tokens that extend the challenge window", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      expirationTime: new Date(NOW.getTime() + WALLET_AUTH_TTL_MS + 60_000),
    });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "invalid_message",
      status: 400,
    });
  });

  it("rejects unknown nonce never issued by generateChallenge", async () => {
    const token = await createToken({ nonce: "fabricatedNonce12345678" });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "challenge_expired",
      status: 410,
    });
  });
});

// ---------------------------------------------------------------------------
// Origin binding
// ---------------------------------------------------------------------------

describe("origin binding", () => {
  it("rejects tokens signed for a different origin", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      origin: "https://evil.example",
    });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "wrong_origin",
      status: 401,
    });
  });
});

// ---------------------------------------------------------------------------
// Chain binding
// ---------------------------------------------------------------------------

describe("chain binding", () => {
  it("rejects tokens signed for a different chain", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      chainId: 1,
    });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "wrong_chain",
      status: 401,
    });
  });
});

// ---------------------------------------------------------------------------
// Statement binding
// ---------------------------------------------------------------------------

describe("statement binding", () => {
  it("rejects tokens with a different statement", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      statement: "Sign me into a phishing site",
    });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "invalid_message",
      status: 400,
    });
  });
});

// ---------------------------------------------------------------------------
// Address mismatch
// ---------------------------------------------------------------------------

describe("address mismatch", () => {
  it("rejects token with address field that differs from the signer", async () => {
    const challenge = generateChallenge(NOW);
    const token = await createToken({
      nonce: challenge.nonce,
      addressOverride: "0x0000000000000000000000000000000000000001",
    });

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "invalid_message",
      status: 400,
    });
  });
});

// ---------------------------------------------------------------------------
// Invalid signature
// ---------------------------------------------------------------------------

describe("invalid signature", () => {
  it("rejects tokens signed by a different key", async () => {
    const challenge = generateChallenge(NOW);
    const otherAccount = privateKeyToAccount(generatePrivateKey());

    // Sign with the other account's key but claim to be ACCOUNT's address
    const message = createSiweMessage({
      address: ACCOUNT.address,
      chainId: WALLET_AUTH_CHAIN_ID,
      domain: new URL(ORIGIN).host,
      expirationTime: new Date(NOW.getTime() + WALLET_AUTH_TTL_MS),
      issuedAt: NOW,
      nonce: challenge.nonce,
      statement: WALLET_AUTH_STATEMENT,
      uri: ORIGIN,
      version: "1",
    });

    const signature = await otherAccount.signMessage({ message });
    const token = Buffer.from(
      JSON.stringify({ message, signature, address: ACCOUNT.address }),
    ).toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "invalid_signature",
      status: 401,
    });
  });
});

// ---------------------------------------------------------------------------
// Malformed tokens
// ---------------------------------------------------------------------------

describe("malformed tokens", () => {
  it("rejects empty string", async () => {
    generateChallenge(NOW); // ensure store isn't empty

    await expect(
      verifyConnectToken("", ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects non-base64 garbage", async () => {
    generateChallenge(NOW);

    await expect(
      verifyConnectToken("!!!not-base64!!!", ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects valid base64 that is not JSON", async () => {
    generateChallenge(NOW);
    const token = Buffer.from("not json at all").toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects valid JSON missing message field", async () => {
    generateChallenge(NOW);
    const token = Buffer.from(
      JSON.stringify({ signature: "0xabc", address: ACCOUNT.address }),
    ).toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects valid JSON missing signature field", async () => {
    generateChallenge(NOW);
    const token = Buffer.from(
      JSON.stringify({ message: "some message", address: ACCOUNT.address }),
    ).toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects valid JSON with non-hex signature", async () => {
    generateChallenge(NOW);
    const token = Buffer.from(
      JSON.stringify({ message: "some message", signature: "not-hex" }),
    ).toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });

  it("rejects valid JSON with invalid address format", async () => {
    generateChallenge(NOW);
    const token = Buffer.from(
      JSON.stringify({
        message: "some message",
        signature: "0xabc",
        address: "not-an-address",
      }),
    ).toString("base64url");

    await expect(
      verifyConnectToken(token, ORIGIN, VERIFIED_AT),
    ).rejects.toMatchObject({
      code: "malformed_token",
      status: 400,
    });
  });
});
