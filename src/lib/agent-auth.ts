import type { AgentRecord } from "@/lib/agents";
import {
  extractAgentKeyPrefix,
  getAgentById,
  getAgentKeyLookup,
  hashAgentKey,
} from "@/lib/agents";

export async function validateAgentKey(
  request: Pick<Request, "headers">,
): Promise<AgentRecord | null> {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token, ...rest] = authorization.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }

  const keyPrefix = extractAgentKeyPrefix(token);

  if (!keyPrefix) {
    return null;
  }

  const lookup = await getAgentKeyLookup(keyPrefix);

  if (!lookup) {
    return null;
  }

  const apiKeyHash = await hashAgentKey(token);

  if (lookup.apiKeyHash !== apiKeyHash) {
    return null;
  }

  return getAgentById(lookup.agentId);
}
