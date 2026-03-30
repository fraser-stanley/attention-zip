import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button-variants";

describe("buttonVariants", () => {
  it("pins buttons to sans typography and the shared keyboard focus treatment", () => {
    const classes = buttonVariants();

    expect(classes).toContain("font-sans");
    expect(classes).toContain("focus-visible:border-ring");
    expect(classes).toContain("focus-visible:ring-[3px]");
    expect(classes).toContain("focus-visible:ring-ring/50");
    expect(classes).toContain("focus-visible:outline-1");
    expect(classes).toContain("focus-visible:outline-ring");
  });

  it("exposes the quiet variant for text-only button surfaces", () => {
    const classes = buttonVariants({ variant: "quiet" });

    expect(classes).toContain("text-muted-foreground");
    expect(classes).toContain("hover:text-foreground");
    expect(classes).not.toContain("hover:underline");
  });
});
