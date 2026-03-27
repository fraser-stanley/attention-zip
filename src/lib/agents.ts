import { getRedis } from "@/lib/redis";
import { toAbsoluteUrl } from "@/lib/site";
import { normalizeWalletAddress } from "@/lib/wallet-address";

const AGENT_NAME_PATTERN = /^[a-z0-9-]{1,64}$/;
const AGENT_KEY_PATTERN = /^sk_zora_([a-f0-9]{32})$/;
const KEY_PREFIX_PATTERN = /^[a-f0-9]{8}$/;
const CLAIM_CODE_PATTERN = /^([a-z]+)-([a-z0-9]{4})$/i;
const CLAIM_SUFFIX_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CLAIM_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

const CLAIM_WORDS = [
  "amber",
  "apex",
  "atlas",
  "bay",
  "beacon",
  "birch",
  "bluff",
  "bloom",
  "branch",
  "brook",
  "cinder",
  "cliff",
  "cloud",
  "coast",
  "copper",
  "coral",
  "crest",
  "crown",
  "dawn",
  "delta",
  "dune",
  "ember",
  "fern",
  "field",
  "flare",
  "forest",
  "frost",
  "glade",
  "glow",
  "grove",
  "harbor",
  "hollow",
  "isle",
  "jetty",
  "lagoon",
  "lake",
  "lark",
  "linen",
  "marble",
  "meadow",
  "mist",
  "moon",
  "nova",
  "orbit",
  "pearl",
  "pine",
  "prism",
  "quartz",
  "rain",
  "reef",
  "ridge",
  "river",
  "sable",
  "sage",
  "shore",
  "signal",
  "silver",
  "sketch",
  "sky",
  "spruce",
  "star",
  "stone",
  "stream",
  "summit",
  "surf",
  "thicket",
  "timber",
  "trail",
  "vale",
  "vista",
  "wave",
  "willow",
] as const;

export type AgentStatus = "unclaimed" | "active" | "suspended";
export type AgentClaimLookup =
  | "missing"
  | "available"
  | "claimed"
  | "suspended";

export interface AgentRecord {
  agentId: string;
  claimCode: string;
  claimedAt: string | null;
  createdAt: string;
  description: string | null;
  keyPrefix: string;
  name: string;
  runtime: string | null;
  status: AgentStatus;
  wallet: string | null;
}

export interface AgentKeyLookup {
  agentId: string;
  apiKeyHash: string;
}

export interface CreatedAgent {
  agentId: string;
  apiKey: string;
  claimCode: string;
  claimUrl: string;
  keyPrefix: string;
  status: AgentStatus;
}

export class AgentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentInputError";
  }
}

function agentRedisKey(agentId: string) {
  return `agent:${agentId}`;
}

function apiKeyRedisKey(keyPrefix: string) {
  return `apikey:${keyPrefix}`;
}

function claimRedisKey(claimCode: string) {
  return `claim:${claimCode}`;
}

function isAgentStatus(value: unknown): value is AgentStatus {
  return value === "unclaimed" || value === "active" || value === "suspended";
}

function isAgentRecord(value: unknown): value is AgentRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AgentRecord>;

  return (
    typeof candidate.agentId === "string" &&
    typeof candidate.claimCode === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.keyPrefix === "string" &&
    typeof candidate.name === "string" &&
    isAgentStatus(candidate.status) &&
    (candidate.description === null || typeof candidate.description === "string") &&
    (candidate.runtime === null || typeof candidate.runtime === "string") &&
    (candidate.wallet === null || typeof candidate.wallet === "string") &&
    (candidate.claimedAt === null || typeof candidate.claimedAt === "string")
  );
}

function isAgentKeyLookup(value: unknown): value is AgentKeyLookup {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AgentKeyLookup>;
  return (
    typeof candidate.agentId === "string" &&
    typeof candidate.apiKeyHash === "string"
  );
}

function requireRedis() {
  const redis = getRedis();

  if (!redis) {
    throw new Error("Redis is not configured.");
  }

  return redis;
}

function normalizeAgentName(value: unknown) {
  if (typeof value !== "string") {
    throw new AgentInputError("name is required.");
  }

  const normalized = value.trim();

  if (!AGENT_NAME_PATTERN.test(normalized)) {
    throw new AgentInputError(
      "name must match ^[a-z0-9-]{1,64}$.",
    );
  }

  return normalized;
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AgentInputError(`${fieldName} must be a string.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new AgentInputError(
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return normalized;
}

async function hashValue(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function randomHex(length: number) {
  if (length % 2 !== 0) {
    throw new Error("Hex length must be even.");
  }

  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function randomWord() {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % CLAIM_WORDS.length;
  return CLAIM_WORDS[index] ?? CLAIM_WORDS[0];
}

function randomClaimSuffix() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) => CLAIM_SUFFIX_ALPHABET[byte % CLAIM_SUFFIX_ALPHABET.length],
  ).join("");
}

async function generateAgentId() {
  const redis = requireRedis();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const agentId = `agent_${randomHex(16)}`;
    const existing = await redis.get(agentRedisKey(agentId));

    if (!existing) {
      return agentId;
    }
  }

  throw new Error("Failed to generate a unique agent id.");
}

async function generateApiKey() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const apiKeyBody = randomHex(32);
    const keyPrefix = apiKeyBody.slice(0, 8);
    const existing = await getAgentKeyLookup(keyPrefix);

    if (existing) {
      continue;
    }

    const apiKey = `sk_zora_${apiKeyBody}`;

    return {
      apiKey,
      apiKeyHash: await hashValue(apiKey),
      keyPrefix,
    };
  }

  throw new Error("Failed to generate a unique API key.");
}

async function generateClaimCode() {
  const redis = requireRedis();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const claimCode = `${randomWord()}-${randomClaimSuffix()}`;
    const existing = await redis.get(claimRedisKey(claimCode));

    if (!existing) {
      return claimCode;
    }
  }

  throw new Error("Failed to generate a unique claim code.");
}

export function normalizeClaimCode(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const match = CLAIM_CODE_PATTERN.exec(normalized);

  if (!match) {
    return null;
  }

  return `${match[1].toLowerCase()}-${match[2].toUpperCase()}`;
}

export function extractAgentKeyPrefix(apiKey: string | null | undefined) {
  if (typeof apiKey !== "string") {
    return null;
  }

  const match = AGENT_KEY_PATTERN.exec(apiKey.trim());

  if (!match) {
    return null;
  }

  return match[1].slice(0, 8);
}

export function buildClaimUrl(claimCode: string, siteUrl: string) {
  const normalizedClaimCode = normalizeClaimCode(claimCode);

  if (!normalizedClaimCode) {
    throw new AgentInputError("claim_code must match word-AB12.");
  }

  return toAbsoluteUrl(`/claim/${normalizedClaimCode}`, siteUrl);
}

export async function getAgentById(agentId: string) {
  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    return null;
  }

  const redis = getRedis();

  if (!redis) {
    return null;
  }

  const agent = await redis.get<AgentRecord>(agentRedisKey(agentId.trim()));
  return isAgentRecord(agent) ? agent : null;
}

export async function getAgentByClaimCode(claimCode: string) {
  const normalizedClaimCode = normalizeClaimCode(claimCode);

  if (!normalizedClaimCode) {
    return null;
  }

  const redis = getRedis();

  if (!redis) {
    return null;
  }

  const agentId = await redis.get<string>(claimRedisKey(normalizedClaimCode));

  if (typeof agentId !== "string" || agentId.length === 0) {
    return null;
  }

  return getAgentById(agentId);
}

export async function getAgentKeyLookup(keyPrefix: string) {
  const normalizedKeyPrefix = keyPrefix.trim().toLowerCase();

  if (!KEY_PREFIX_PATTERN.test(normalizedKeyPrefix)) {
    return null;
  }

  const redis = getRedis();

  if (!redis) {
    return null;
  }

  const lookup = await redis.get<AgentKeyLookup>(
    apiKeyRedisKey(normalizedKeyPrefix),
  );

  return isAgentKeyLookup(lookup) ? lookup : null;
}

export async function getAgentClaimLookup(
  claimCode: string,
): Promise<AgentClaimLookup> {
  const agent = await getAgentByClaimCode(claimCode);

  if (!agent) {
    return "missing" as const;
  }

  if (agent.status === "unclaimed") {
    return "available" as const;
  }

  if (agent.status === "suspended") {
    return "suspended" as const;
  }

  return "claimed" as const;
}

export async function createAgentRegistration({
  name,
  description,
  runtime,
  siteUrl,
}: {
  description?: unknown;
  name: unknown;
  runtime?: unknown;
  siteUrl: string;
}): Promise<CreatedAgent> {
  const redis = requireRedis();
  const normalizedName = normalizeAgentName(name);
  const normalizedDescription = normalizeOptionalText(
    description,
    "description",
    280,
  );
  const normalizedRuntime = normalizeOptionalText(runtime, "runtime", 64);

  const agentId = await generateAgentId();
  const { apiKey, apiKeyHash, keyPrefix } = await generateApiKey();
  const claimCode = await generateClaimCode();
  const createdAt = new Date().toISOString();

  const agent: AgentRecord = {
    agentId,
    claimCode,
    claimedAt: null,
    createdAt,
    description: normalizedDescription,
    keyPrefix,
    name: normalizedName,
    runtime: normalizedRuntime,
    status: "unclaimed",
    wallet: null,
  };

  await redis.set(agentRedisKey(agentId), agent);
  await redis.set(apiKeyRedisKey(keyPrefix), { agentId, apiKeyHash });
  await redis.set(claimRedisKey(claimCode), agentId, {
    ex: CLAIM_TTL_SECONDS,
  });

  return {
    agentId,
    apiKey,
    claimCode,
    claimUrl: buildClaimUrl(claimCode, siteUrl),
    keyPrefix,
    status: agent.status,
  };
}

export async function claimAgent({
  claimCode,
  wallet,
}: {
  claimCode: string;
  wallet: string;
}) {
  const redis = requireRedis();
  const normalizedClaimCode = normalizeClaimCode(claimCode);

  if (!normalizedClaimCode) {
    throw new AgentInputError("claim_code must match word-AB12.");
  }

  const normalizedWallet = normalizeWalletAddress(wallet);

  if (!normalizedWallet) {
    throw new AgentInputError("wallet must be a valid 0x address.");
  }

  const agent = await getAgentByClaimCode(normalizedClaimCode);

  if (!agent) {
    return null;
  }

  if (agent.status !== "unclaimed") {
    return agent;
  }

  const updatedAgent: AgentRecord = {
    ...agent,
    claimedAt: new Date().toISOString(),
    status: "active",
    wallet: normalizedWallet,
  };

  await redis.set(agentRedisKey(updatedAgent.agentId), updatedAgent);
  await redis.set(claimRedisKey(normalizedClaimCode), updatedAgent.agentId);

  return updatedAgent;
}

export async function hashAgentKey(apiKey: string) {
  return hashValue(apiKey);
}
