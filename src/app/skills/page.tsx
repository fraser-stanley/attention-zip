import { SkillsInstallList } from "@/components/skill-card-client";
import { getSkillInstallCommands, skills } from "@/lib/skills";
import { toAbsoluteUrl } from "@/lib/site";

export default function SkillsPage() {
  const skillJsonLd = skills.map((skill) => {
    const install = getSkillInstallCommands(skill);

    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: skill.name,
      description: skill.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [...skill.monitors, ...skill.wraps],
      keywords: skill.badges.join(", "),
      url: toAbsoluteUrl(`/skills#${skill.id}`),
      downloadUrl: skill.skillMdUrl,
      codeRepository: skill.githubUrl,
      installUrl: install.cli,
    };
  });

  return (
    <div className="space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <section className="border-b border-border pb-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)] lg:items-end">
          <div className="space-y-4">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Skill gallery
            </p>
            <h1 className="max-w-4xl text-4xl tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Published skills for the runtime you already use.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Every skill is a <code>SKILL.md</code> we wrote and
              reviewed. Pick <strong>Zora CLI</strong>, <strong>OpenClaw</strong>,
              or manual install, then inspect the command and source
              before you enable anything.
            </p>
          </div>

          <div className="relative overflow-hidden border border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_3%,transparent),transparent)] p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Before you enable
            </p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                Every install path here points to published source. Read-only
                skills stay in scout mode. Execution skills belong in a dedicated
                trader wallet with bounded funds.
              </p>
              <p className="text-foreground">
                No custody. No server-side execution. Source, commands, and
                scope you can read.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              5 reviewed skills
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Trends, momentum, briefings, portfolio, and execution.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              3 install paths
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Zora CLI, OpenClaw, or manual fetch without leaving the page.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              1 execution skill
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Separate from read-only scouts, labeled so you know what it does.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border-t border-border pt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            01
          </p>
          <h2 className="mt-2 text-base font-medium">Choose a runtime once</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Switch between Zora CLI, OpenClaw, or manual install. The choice
            persists while you move around the site.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            02
          </p>
          <h2 className="mt-2 text-base font-medium">Copy the exact command</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Each skill shows the install command for your chosen runtime.
            Copy and run.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            03
          </p>
          <h2 className="mt-2 text-base font-medium">Verify the scope</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Read the source, commands, prompts, and example output before
            your agent runs anything.
          </p>
        </div>
      </section>

      <SkillsInstallList skills={skills} />
    </div>
  );
}
