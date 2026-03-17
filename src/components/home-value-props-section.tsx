import { skills } from "@/lib/skills";

const executionSkillCount = skills.filter((skill) => skill.risk !== "none").length;
const readOnlySkillCount = skills.filter((skill) => skill.risk === "none").length;

export function HomeValuePropsSection() {
  return (
    <section aria-labelledby="home-value-props-title" className="space-y-6">
      <h2 id="home-value-props-title" className="sr-only">
        Why start here
      </h2>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Published source
          </p>
          <p className="text-base font-medium">Read the skill before it runs</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Every install path points to a readable
            <code className="mx-1 bg-muted px-1.5 py-0.5">SKILL.md</code>
            you can inspect first.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {readOnlySkillCount} read-only skills
          </p>
          <p className="text-base font-medium">Start without keys</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Trends, creators, briefings, and portfolio reads stay in scout
            mode until you choose otherwise.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {executionSkillCount} execution path
          </p>
          <p className="text-base font-medium">Keep risk explicit</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Momentum Trader is labeled separately and belongs in a dedicated
            trader wallet with bounded funds.
          </p>
        </div>
      </div>
    </section>
  );
}
