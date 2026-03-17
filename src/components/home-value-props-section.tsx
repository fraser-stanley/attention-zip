import { skills } from "@/lib/skills";

const executionSkillCount = skills.filter((skill) => skill.risk !== "none").length;
const readOnlySkillCount = skills.filter((skill) => skill.risk === "none").length;

function PublishedSourceIllustration() {
  return (
    <svg
      viewBox="0 0 320 140"
      className="h-32 w-full text-foreground/80"
      aria-hidden="true"
    >
      <rect x="28" y="24" width="78" height="34" fill="none" stroke="currentColor" />
      <rect x="121" y="45" width="78" height="34" fill="none" stroke="currentColor" />
      <rect x="214" y="17" width="78" height="34" fill="none" stroke="currentColor" />
      <path d="M67 58v45" fill="none" stroke="currentColor" />
      <path d="M160 79v24" fill="none" stroke="currentColor" />
      <path d="M253 51v52" fill="none" stroke="currentColor" />
      <path d="M67 103h93" fill="none" stroke="currentColor" />
      <path d="M160 103h93" fill="none" stroke="currentColor" />
      <circle cx="67" cy="103" r="4" fill="currentColor" />
      <circle cx="160" cy="103" r="4" fill="currentColor" />
      <circle cx="253" cy="103" r="4" fill="#3FFF00" />
      <path d="M49 39h36" fill="none" stroke="currentColor" />
      <path d="M49 48h26" fill="none" stroke="currentColor" />
      <path d="M142 60h36" fill="none" stroke="currentColor" />
      <path d="M142 69h26" fill="none" stroke="currentColor" />
      <path d="M235 32h36" fill="none" stroke="currentColor" />
      <path d="M235 41h26" fill="none" stroke="currentColor" />
    </svg>
  );
}

function ReadOnlyIllustration() {
  return (
    <svg
      viewBox="0 0 320 140"
      className="h-32 w-full text-foreground/80"
      aria-hidden="true"
    >
      <circle cx="72" cy="74" r="24" fill="none" stroke="currentColor" />
      <circle cx="72" cy="74" r="10" fill="#3FFF00" stroke="currentColor" />
      <circle cx="160" cy="52" r="18" fill="none" stroke="currentColor" />
      <circle cx="244" cy="86" r="18" fill="none" stroke="currentColor" />
      <path d="M96 74h46" fill="none" stroke="currentColor" />
      <path d="M177 58l49 20" fill="none" stroke="currentColor" />
      <path d="M96 96h180" fill="none" stroke="currentColor" strokeDasharray="6 6" />
      <rect x="120" y="100" width="92" height="24" fill="none" stroke="currentColor" />
      <path d="M146 112h40" fill="none" stroke="currentColor" />
      <path d="M151 106v12" fill="none" stroke="currentColor" />
      <path d="M181 106v12" fill="none" stroke="currentColor" />
    </svg>
  );
}

function RiskIllustration() {
  return (
    <svg
      viewBox="0 0 320 140"
      className="h-32 w-full text-foreground/80"
      aria-hidden="true"
    >
      <rect x="28" y="30" width="86" height="22" fill="none" stroke="currentColor" />
      <rect x="28" y="62" width="86" height="22" fill="none" stroke="currentColor" />
      <rect x="28" y="94" width="86" height="22" fill="none" stroke="currentColor" />
      <path d="M114 41h48" fill="none" stroke="currentColor" />
      <path d="M114 73h48" fill="none" stroke="currentColor" />
      <path d="M114 105h48" fill="none" stroke="currentColor" />
      <rect x="182" y="44" width="110" height="58" fill="none" stroke="currentColor" />
      <rect x="200" y="62" width="36" height="22" fill="#3FFF00" stroke="currentColor" />
      <path d="M246 73h26" fill="none" stroke="currentColor" />
      <path d="M260 61v24" fill="none" stroke="currentColor" />
    </svg>
  );
}

export function HomeValuePropsSection() {
  return (
    <section aria-label="Homepage value props">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="group h-full border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/30 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <span className="inline-flex border border-border bg-background px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Published source
              </span>
              <div className="bg-muted/30 px-4 py-3">
                <PublishedSourceIllustration />
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-[1.75rem] font-medium tracking-[-0.04em]">
                Read the skill before it runs
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Every install path points to a readable <code className="bg-muted px-1.5 py-0.5">SKILL.md</code> you can inspect first.
              </p>
            </div>
          </div>
        </article>

        <article className="group h-full border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/30 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <span className="inline-flex border border-border bg-background px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {readOnlySkillCount} read-only skills
              </span>
              <div className="bg-muted/30 px-4 py-3">
                <ReadOnlyIllustration />
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-[1.75rem] font-medium tracking-[-0.04em]">
                Start without keys
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Trends, creators, briefings, and portfolio reads stay in scout
                mode until you choose otherwise.
              </p>
            </div>
          </div>
        </article>

        <article className="group h-full border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/30 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <span className="inline-flex border border-border bg-background px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {executionSkillCount} execution path
              </span>
              <div className="bg-muted/30 px-4 py-3">
                <RiskIllustration />
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-[1.75rem] font-medium tracking-[-0.04em]">
                Keep risk explicit
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Momentum Trader is labeled separately and belongs in a dedicated
                trader wallet with bounded funds.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
