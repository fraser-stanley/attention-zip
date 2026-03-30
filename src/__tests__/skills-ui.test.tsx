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
  it("keeps copy-and-read actions without fake install state", () => {
    render(<SkillsInstallList skills={skills.slice(0, 1)} />);

    expect(screen.getByRole("button", { name: /see example/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /source/i })).toBeTruthy();
    expect(screen.getAllByTitle(/copy command/i)).toHaveLength(2);
    expect(screen.queryByText("Install")).toBeNull();
    expect(screen.queryByText("Installing...")).toBeNull();
    expect(screen.queryByText("Installed")).toBeNull();
    expect(screen.queryByText("Remove")).toBeNull();
  });
});
