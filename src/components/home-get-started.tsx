import { CopyableCodeBlock } from "@/components/copyable-code-block";
import { skills, getSkillRuntimeCommands } from "@/lib/skills";
import { getSiteUrl } from "@/lib/site";

function getSteps() {
  const trendScout = skills[0];
  const commands = getSkillRuntimeCommands(trendScout, getSiteUrl());

  return [
    {
      number: "01",
      title: "Paste the command",
      description:
        "Run this in your terminal. Then check the entrypoint and env vars.",
      command: commands.claude,
      prefix: "$",
    },
    {
      number: "02",
      title: "Run the skill",
      description:
        "Trigger the entrypoint once before you move it onto a schedule.",
      command: trendScout.samplePrompt,
      prefix: ">",
    },
  ] as const;
}

export function HomeGetStarted() {
  const steps = getSteps();

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
