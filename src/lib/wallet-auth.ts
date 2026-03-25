import { isAddressEqual, isHex, verifyMessage, type Address, type Hex } from "viem";
import {
  generateSiweNonce,
  parseSiweMessage,
  validateSiweMessage,
} from "viem/siwe";
import type { WalletSession } from "@/lib/wallet-session";

export const WALLET_AUTH_CHAIN_ID = 8453;
export const WALLET_AUTH_TTL_SECONDS = 300;
export const WALLET_AUTH_TTL_MS = WALLET_AUTH_TTL_SECONDS * 1000;
export const WALLET_AUTH_STATEMENT =
  "Connect this Zora CLI wallet to Attention Index";

type WalletChallenge = {
  expiresAt: number;
};

type DecodedConnectToken = {
  message: string;
  signature: Hex;
  address?: Address;
};

export type WalletAuthErrorCode =
  | "challenge_expired"
  | "invalid_signature"
  | "malformed_token"
  | "wrong_chain"
  | "wrong_origin"
  | "invalid_message";

export class WalletAuthError extends Error {
  constructor(
    public readonly code: WalletAuthErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WalletAuthError";
  }
}

const challengeStore = new Map<string, WalletChallenge>();
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function cleanExpiredChallenges(nowMs: number) {
  for (const [nonce, challenge] of challengeStore) {
    if (challenge.expiresAt <= nowMs) {
      challengeStore.delete(nonce);
    }
  }
}

function createError(
  code: WalletAuthErrorCode,
  message: string,
  status = 400,
) {
  return new WalletAuthError(code, message, status);
}

function decodeConnectToken(token: string): DecodedConnectToken {
  const trimmed = token.trim();
  if (!trimmed) {
    throw createError("malformed_token", "Paste the token from the Zora CLI.", 400);
  }

  let raw: string | null = null;

  for (const encoding of ["base64url", "base64"] as const) {
    try {
      raw = Buffer.from(trimmed, encoding).toString("utf8");
      break;
    } catch {
      // Try the next encoding. The CLI may emit either format.
    }
  }

  if (!raw) {
    throw createError("malformed_token", "The pasted token is not valid base64.", 400);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw createError("malformed_token", "The pasted token is not valid JSON.", 400);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw createError("malformed_token", "The pasted token is missing fields.", 400);
  }

  const candidate = parsed as {
    message?: unknown;
    signature?: unknown;
    address?: unknown;
  };

  if (typeof candidate.message !== "string" || !candidate.message.trim()) {
    throw createError("malformed_token", "The pasted token is missing the SIWE message.", 400);
  }

  if (typeof candidate.signature !== "string" || !isHex(candidate.signature)) {
    throw createError("malformed_token", "The pasted token is missing a valid signature.", 400);
  }

  if (
    candidate.address !== undefined &&
    (typeof candidate.address !== "string" || !ADDRESS_PATTERN.test(candidate.address))
  ) {
    throw createError("malformed_token", "The pasted token has an invalid address field.", 400);
  }

  return {
    message: candidate.message,
    signature: candidate.signature,
    address: typeof candidate.address === "string" ? (candidate.address as Address) : undefined,
  };
}

function normalizeExpectedOrigin(origin: string) {
  const url = new URL(origin);
  return {
    origin: url.origin,
    host: url.host,
    scheme: url.protocol.replace(/:$/, ""),
  };
}

function assertValidUri(uri: string, expectedOrigin: string) {
  let url: URL;

  try {
    url = new URL(uri);
  } catch {
    throw createError("invalid_message", "The SIWE message is missing a valid URI.", 400);
  }

  if (
    url.origin !== expectedOrigin ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw createError(
      "wrong_origin",
      "This token was created for a different site origin.",
      401,
    );
  }
}

function assertChallenge(nonce: string, nowMs: number) {
  const challenge = challengeStore.get(nonce);

  if (!challenge || challenge.expiresAt <= nowMs) {
    challengeStore.delete(nonce);
    throw createError(
      "challenge_expired",
      "This challenge expired or has already been used. Generate a new command.",
      410,
    );
  }

  return challenge;
}

export function buildWalletConnectCommand(origin: string, nonce: string) {
  return `zora auth connect --origin ${origin} --nonce ${nonce} --expires-in ${WALLET_AUTH_TTL_SECONDS}`;
}

export function generateChallenge(now = new Date()) {
  const nowMs = now.getTime();
  cleanExpiredChallenges(nowMs);

  const nonce = generateSiweNonce();
  const expiresAt = nowMs + WALLET_AUTH_TTL_MS;

  challengeStore.set(nonce, { expiresAt });

  return {
    nonce,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function verifyConnectToken(
  token: string,
  expectedOrigin: string,
  now = new Date(),
): Promise<WalletSession> {
  const nowMs = now.getTime();
  cleanExpiredChallenges(nowMs);

  const decoded = decodeConnectToken(token);

  let parsed: ReturnType<typeof parseSiweMessage>;
  try {
    parsed = parseSiweMessage(decoded.message);
  } catch {
    throw createError("malformed_token", "The SIWE message could not be parsed.", 400);
  }

  if (
    !parsed.address ||
    !parsed.nonce ||
    !parsed.domain ||
    !parsed.uri ||
    !parsed.issuedAt ||
    !parsed.expirationTime
  ) {
    throw createError("invalid_message", "The SIWE message is missing required fields.", 400);
  }

  const expected = normalizeExpectedOrigin(expectedOrigin);
  const challenge = assertChallenge(parsed.nonce, nowMs);

  if (parsed.domain !== expected.host) {
    throw createError(
      "wrong_origin",
      "This token was created for a different site origin.",
      401,
    );
  }

  if (parsed.scheme && parsed.scheme !== expected.scheme) {
    throw createError(
      "wrong_origin",
      "This token was created for a different site origin.",
      401,
    );
  }

  assertValidUri(parsed.uri, expected.origin);

  if (parsed.chainId !== WALLET_AUTH_CHAIN_ID) {
    throw createError(
      "wrong_chain",
      `This token is for chain ${String(parsed.chainId)}, expected Base (${String(WALLET_AUTH_CHAIN_ID)}).`,
      401,
    );
  }

  if (parsed.statement !== WALLET_AUTH_STATEMENT) {
    throw createError("invalid_message", "The SIWE statement does not match this site.", 400);
  }

  if (
    decoded.address &&
    !isAddressEqual(decoded.address, parsed.address)
  ) {
    throw createError("invalid_message", "The token address does not match the signed message.", 400);
  }

  if (parsed.expirationTime.getTime() > challenge.expiresAt) {
    throw createError(
      "invalid_message",
      "The token expiry exceeds the issued challenge window.",
      400,
    );
  }

  const messageValid = validateSiweMessage({
    address: decoded.address,
    domain: expected.host,
    message: parsed,
    nonce: parsed.nonce,
    time: now,
  });

  if (!messageValid) {
    throw createError(
      "challenge_expired",
      "This challenge expired or has already been used. Generate a new command.",
      410,
    );
  }

  let signatureValid = false;

  try {
    signatureValid = await verifyMessage({
      address: parsed.address,
      message: decoded.message,
      signature: decoded.signature,
    });
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    throw createError("invalid_signature", "The token signature is invalid.", 401);
  }

  challengeStore.delete(parsed.nonce);

  return {
    address: parsed.address,
    source: "zora-cli",
    connectedAt: now.toISOString(),
  };
}

export function resetWalletAuthForTests() {
  challengeStore.clear();
}
