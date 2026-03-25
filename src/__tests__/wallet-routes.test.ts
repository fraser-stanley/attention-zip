import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSiweMessage } from "viem/siwe";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";
import { POST as challengePOST } from "@/app/api/wallet/challenge/route";
import { POST as verifyPOST } from "@/app/api/wallet/verify/route";
import {
  WALLET_AUTH_CHAIN_ID,
  WALLET_AUTH_STATEMENT,
  WALLET_AUTH_TTL_MS,
  WALLET_AUTH_TTL_SECONDS,
  resetWalletAuthForTests,
} from "@/lib/wallet-auth";

const ORIGIN = "https://attentionindex.xyz";
const WRONG_ORIGIN = "https://evil.example";
const NOW = new Date("2026-03-25T14:00:00.000Z");
const VERIFIED_AT = new Date("2026-03-25T14:01:00.000Z");
const ACCOUNT = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945382d7c0558a9a0a4de3983c02d6b98759aa",
);

beforeEach(() => {
  resetWalletAuthForTests();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
}

function challengeRequest(origin = ORIGIN) {
  return new NextRequest(new URL("/api/wallet/challenge", origin), {
    method: "POST",
  });
}

function verifyRequest(body: unknown, origin = ORIGIN) {
  return new NextRequest(new URL("/api/wallet/verify", origin), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function verifyInvalidJsonRequest(body = "not json", origin = ORIGIN) {
  return new NextRequest(new URL("/api/wallet/verify", origin), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

async function createToken({
  origin = ORIGIN,
  nonce,
  issuedAt = NOW,
  expirationTime = new Date(issuedAt.getTime() + WALLET_AUTH_TTL_MS),
  statement = WALLET_AUTH_STATEMENT,
  chainId = WALLET_AUTH_CHAIN_ID,
  encoding = "base64url",
  signer = ACCOUNT,
  messageAddress = signer.address,
  tokenAddress = messageAddress,
}: {
  origin?: string;
  nonce: string;
  issuedAt?: Date;
  expirationTime?: Date;
  statement?: string;
  chainId?: number;
  encoding?: "base64" | "base64url";
  signer?: ReturnType<typeof privateKeyToAccount>;
  messageAddress?: Address;
  tokenAddress?: Address;
}) {
  const message = createSiweMessage({
    address: messageAddress,
    chainId,
    domain: new URL(origin).host,
    expirationTime,
    issuedAt,
    nonce,
    statement,
    uri: origin,
    version: "1",
  });

  const signature = await signer.signMessage({ message });
  return Buffer.from(
    JSON.stringify({
      message,
      signature,
      address: tokenAddress,
    }),
  ).toString(encoding);
}

async function createTokenWithMismatchedNonceSignature({
  signedNonce,
  claimedNonce,
  signer = ACCOUNT,
  origin = ORIGIN,
}: {
  signedNonce: string;
  claimedNonce: string;
  signer?: ReturnType<typeof privateKeyToAccount>;
  origin?: string;
}) {
  const signedMessage = createSiweMessage({
    address: signer.address,
    chainId: WALLET_AUTH_CHAIN_ID,
    domain: new URL(origin).host,
    expirationTime: new Date(NOW.getTime() + WALLET_AUTH_TTL_MS),
    issuedAt: NOW,
    nonce: signedNonce,
    statement: WALLET_AUTH_STATEMENT,
    uri: origin,
    version: "1",
  });

  const claimedMessage = createSiweMessage({
    address: signer.address,
    chainId: WALLET_AUTH_CHAIN_ID,
    domain: new URL(origin).host,
    expirationTime: new Date(NOW.getTime() + WALLET_AUTH_TTL_MS),
    issuedAt: NOW,
    nonce: claimedNonce,
    statement: WALLET_AUTH_STATEMENT,
    uri: origin,
    version: "1",
  });

  const signature = await signer.signMessage({ message: signedMessage });
  return Buffer.from(
    JSON.stringify({
      message: claimedMessage,
      signature,
      address: signer.address,
    }),
  ).toString("base64url");
}

describe("POST /api/wallet/challenge", () => {
  it("returns a challenge payload and wallet command with no-store headers", async () => {
    const response = await challengePOST(challengeRequest());
    const body = await readJson<{
      nonce: unknown;
      expiresAt: unknown;
      command: unknown;
    }>(response);

    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(typeof body.nonce).toBe("string");
    expect(typeof body.expiresAt).toBe("string");
    expect(body.expiresAt).toBe(
      new Date(NOW.getTime() + WALLET_AUTH_TTL_MS).toISOString(),
    );
    expect(typeof body.command).toBe("string");
    expect(body.command).toContain(`--origin ${ORIGIN}`);
    expect(body.command).toContain(`--nonce ${body.nonce as string}`);
    expect(body.command).toContain(`--expires-in ${WALLET_AUTH_TTL_SECONDS}`);
  });

  it("produces a different nonce on successive calls", async () => {
    const first = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const second = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );

    expect(first.nonce).not.toBe(second.nonce);
  });
});

describe("POST /api/wallet/verify", () => {
  it("returns invalid_request for a non-JSON body", async () => {
    const response = await verifyPOST(verifyInvalidJsonRequest());
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(body.code).toBe("invalid_request");
  });

  it("returns invalid_request when the token field is missing", async () => {
    const response = await verifyPOST(verifyRequest({}));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(body.code).toBe("invalid_request");
  });

  it.each([
    { label: "number", token: 123 },
    { label: "null", token: null },
    { label: "array", token: ["token"] },
  ])("returns invalid_request when token is $label", async ({ token }) => {
    const response = await verifyPOST(verifyRequest({ token }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(body.code).toBe("invalid_request");
  });
});

describe("full round-trip", () => {
  it("creates a challenge, verifies a real SIWE token, and blocks replay", async () => {
    const challenge = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const token = await createToken({ nonce: challenge.nonce });

    vi.setSystemTime(VERIFIED_AT);

    const firstResponse = await verifyPOST(verifyRequest({ token }));
    const firstBody = await readJson<{
      address: string;
      session: { address: string; source: string; connectedAt: string };
    }>(firstResponse);

    expect(firstResponse.status).toBe(200);
    expectNoStore(firstResponse);
    expect(firstBody.address).toBe(ACCOUNT.address);
    expect(firstBody.session).toMatchObject({
      address: ACCOUNT.address,
      source: "zora-cli",
      connectedAt: VERIFIED_AT.toISOString(),
    });

    const replayResponse = await verifyPOST(verifyRequest({ token }));
    const replayBody = await readJson<{ code: string }>(replayResponse);

    expect(replayResponse.status).toBe(410);
    expectNoStore(replayResponse);
    expect(replayBody.code).toBe("challenge_expired");
  });

  it("verifies concurrent challenges independently and rejects using the other nonce", async () => {
    const challengeA = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const challengeB = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );

    const tokenA = await createToken({ nonce: challengeA.nonce });
    const tokenB = await createToken({
      nonce: challengeB.nonce,
      signer: privateKeyToAccount(generatePrivateKey()),
    });
    const mismatchedNonceToken = await createTokenWithMismatchedNonceSignature({
      signedNonce: challengeA.nonce,
      claimedNonce: challengeB.nonce,
    });

    vi.setSystemTime(VERIFIED_AT);

    const mismatchResponse = await verifyPOST(
      verifyRequest({ token: mismatchedNonceToken }),
    );
    const mismatchBody = await readJson<{ code: string }>(mismatchResponse);

    expect(mismatchResponse.status).toBe(401);
    expectNoStore(mismatchResponse);
    expect(mismatchBody.code).toBe("invalid_signature");

    const responseA = await verifyPOST(verifyRequest({ token: tokenA }));
    const bodyA = await readJson<{ session: { address: string } }>(responseA);

    expect(responseA.status).toBe(200);
    expect(bodyA.session.address).toBe(ACCOUNT.address);

    const responseB = await verifyPOST(verifyRequest({ token: tokenB }));
    const bodyB = await readJson<{ session: { address: string } }>(responseB);

    expect(responseB.status).toBe(200);
    expect(bodyB.session.address).not.toBe(ACCOUNT.address);
  });
});

describe("error propagation", () => {
  it("returns challenge_expired for an expired challenge", async () => {
    const challenge = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const token = await createToken({ nonce: challenge.nonce });

    vi.setSystemTime(new Date(NOW.getTime() + WALLET_AUTH_TTL_MS + 1_000));

    const response = await verifyPOST(verifyRequest({ token }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(410);
    expectNoStore(response);
    expect(body.code).toBe("challenge_expired");
  });

  it("returns wrong_origin for a token signed against another origin", async () => {
    const challenge = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const token = await createToken({
      nonce: challenge.nonce,
      origin: WRONG_ORIGIN,
    });

    vi.setSystemTime(VERIFIED_AT);

    const response = await verifyPOST(verifyRequest({ token }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(401);
    expectNoStore(response);
    expect(body.code).toBe("wrong_origin");
  });

  it("returns wrong_chain for a token signed against the wrong chain", async () => {
    const challenge = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const token = await createToken({
      nonce: challenge.nonce,
      chainId: 1,
    });

    vi.setSystemTime(VERIFIED_AT);

    const response = await verifyPOST(verifyRequest({ token }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(401);
    expectNoStore(response);
    expect(body.code).toBe("wrong_chain");
  });

  it("returns invalid_signature for a token signed by the wrong key", async () => {
    const challenge = await readJson<{ nonce: string }>(
      await challengePOST(challengeRequest()),
    );
    const token = await createToken({
      nonce: challenge.nonce,
      signer: privateKeyToAccount(generatePrivateKey()),
      messageAddress: ACCOUNT.address,
      tokenAddress: ACCOUNT.address,
    });

    vi.setSystemTime(VERIFIED_AT);

    const response = await verifyPOST(verifyRequest({ token }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(401);
    expectNoStore(response);
    expect(body.code).toBe("invalid_signature");
  });

  it("returns malformed_token for an invalid token payload", async () => {
    const response = await verifyPOST(verifyRequest({ token: "!!!not-base64!!!" }));
    const body = await readJson<{ code: string }>(response);

    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(body.code).toBe("malformed_token");
  });
});
