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
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <section className="space-y-4">
        <h1 className="type-display max-w-5xl pt-[0.06em] leading-[0.94]">
          Published skills for the runtime you already use.
        </h1>
      </section>

      <section className="grid max-w-5xl gap-6 sm:grid-cols-3">
        <div className="space-y-1.5">
          <p className="type-label text-muted-foreground">01</p>
          <h2 className="type-card-title-sans">Pick a runtime</h2>
          <p className="type-body-sm text-muted-foreground">
            Zora CLI, OpenClaw, or curl. The choice persists for the session.
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="type-label text-muted-foreground">02</p>
          <h2 className="type-card-title-sans">Copy the command</h2>
          <p className="type-body-sm text-muted-foreground">
            Each skill shows the install command for your runtime.
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="type-label text-muted-foreground">03</p>
          <h2 className="type-card-title-sans">Verify the scope</h2>
          <p className="type-body-sm text-muted-foreground">
            Read the source, commands, and prompts before enabling.
          </p>
        </div>
      </section>

      <SkillsInstallList skills={skills} />
    </div>
  );
}
