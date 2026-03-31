// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SkillCard } from "@/components/skill-card";
import { skills } from "@/lib/skills";

afterEach(() => {
  cleanup();
});

describe("SkillCard", () => {
  it("renders a linked teaser with no install state copy", () => {
    render(
      <SkillCard href="/skills#trend-scout" skill={skills[0]} />,
    );

    const link = screen.getByRole("link", { name: skills[0].name });
    expect(link.getAttribute("href")).toBe("/skills#trend-scout");
    expect(screen.getByText("View skill")).toBeTruthy();
    expect(screen.queryByText("Install")).toBeNull();
    expect(screen.queryByText("Installed")).toBeNull();
    expect(screen.queryByText("Remove")).toBeNull();
  });
});
