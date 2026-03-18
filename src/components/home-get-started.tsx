import { CopyableCodeBlock } from "@/components/copyable-code-block";

const steps = [
  {
    number: "01",
    title: "Tell your agent",
    description:
      "Paste this into any MCP-compatible agent. Claude, Cursor, OpenClaw, or your own.",
    command:
      "install skill from https://skills.zora.co/api/skills?id=trend-scout",
    prefix: "$",
  },
  {
    number: "02",
    title: "Try it",
    description: "Ask a question. The skill handles the rest.",
    command: "Check Zora for trending coins right now",
    prefix: ">",
  },
] as const;

export function HomeGetStarted() {
  return (
    <section className="space-y-6">
      <h2 className="type-section">Get started in 2 steps</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {steps.map((step) => (
          <div key={step.number} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono type-caption text-muted-foreground/60">
                {step.number}
              </span>
              <h3 className="type-card-title-sans text-foreground">
                {step.title}
              </h3>
            </div>
            <p className="type-body-sm text-muted-foreground">
              {step.description}
            </p>
            <CopyableCodeBlock command={step.command} prefix={step.prefix} />
          </div>
        ))}
      </div>
    </section>
  );
}
