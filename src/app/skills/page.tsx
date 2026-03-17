import { SkillsInstallList } from "@/components/skill-card-client";
import { getSkillInstallCommands, skills } from "@/lib/skills";
import { toAbsoluteUrl } from "@/lib/site";

export default function SkillsPage() {
  const executionSkillCount = skills.filter((skill) => skill.risk !== "none").length;

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
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <section className="space-y-4">
            <h1 className="max-w-5xl font-display text-[clamp(3rem,6vw,5rem)] font-bold leading-[0.94] tracking-tight pt-[0.06em]">
              Published skills for the runtime you already use.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Every skill is a <code className="bg-muted px-1.5 py-0.5">SKILL.md</code> we wrote and
              reviewed. Pick <strong>Zora CLI</strong>, <strong>OpenClaw</strong>,
              or manual install, then inspect the command and source
              before you enable anything.
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {skills.length} reviewed skills. 3 install paths. {executionSkillCount} execution
              skill, clearly labeled.
            </p>
      </section>

      <section className="grid max-w-5xl gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            01
          </p>
          <h2 className="text-base font-medium">Choose a runtime once</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Switch between Zora CLI, OpenClaw, or manual install. The choice
            persists while you move around the site.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            02
          </p>
          <h2 className="text-base font-medium">Copy the exact command</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Each skill shows the install command for your chosen runtime.
            Copy and run.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            03
          </p>
          <h2 className="text-base font-medium">Verify the scope</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Read the source, commands, prompts, and example output before
            your agent runs anything.
          </p>
        </div>
      </section>

      <SkillsInstallList skills={skills} />
    </div>
  );
}
