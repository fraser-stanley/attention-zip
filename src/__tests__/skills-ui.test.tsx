// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SkillsInstallList } from "@/components/skill-card-client";
import { skills } from "@/lib/skills";

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SkillsInstallList", () => {
  it("renders install command, try-it prompt, example disclosure, and source link", () => {
    render(<SkillsInstallList skills={skills.slice(0, 1)} />);

    expect(screen.getByRole("button", { name: /see example/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /source/i })).toBeTruthy();
    // Unified install + per-skill install = 2 copy blocks
    expect(screen.getAllByTitle(/copy command/i)).toHaveLength(2);
    // No install-state buttons should appear (Install/Installing.../Installed/Remove)
    expect(screen.queryByRole("button", { name: /^Install$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Installing/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Installed$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Remove$/ })).toBeNull();
  });
});
