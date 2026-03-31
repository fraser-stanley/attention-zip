import { describe, expect, it } from "vitest";
import {
  createStagingAuthToken,
  sanitizeNextPath,
} from "@/lib/staging-auth";

describe("staging auth helpers", () => {
  it("creates a stable token that does not expose the password", async () => {
    const password = "correct horse battery staple";
    const token = await createStagingAuthToken(password);

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toBe(password);
    await expect(createStagingAuthToken(password)).resolves.toBe(token);
  });

  it("keeps relative next paths", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/skills?id=trend-scout")).toBe(
      "/skills?id=trend-scout",
    );
  });

  it("rejects invalid next paths", () => {
    expect(sanitizeNextPath("https://example.com")).toBe("/");
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("dashboard")).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
  });
});
