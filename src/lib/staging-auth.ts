export const AUTH_COOKIE = "staging_auth";

const encoder = new TextEncoder();

export async function createStagingAuthToken(password: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function sanitizeNextPath(next: unknown) {
  if (typeof next !== "string" || next.length === 0) {
    return "/";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}
