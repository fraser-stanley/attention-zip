import type { Metadata } from "next";
import { SkillsInstallList } from "@/components/skill-card-client";
import { getSkillRuntimeCommands, skills } from "@/lib/skills";
import { getSiteUrl, toAbsoluteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verified Agent Skills for Zora",
  description:
    "Browse managed agent skills for the Zora attention market. Trend scans, creator watchlists, briefings, portfolio checks, and momentum trading.",
  alternates: { canonical: "/skills" },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to install an agent skill for Zora",
  description: "Install a managed Zora skill in your agent runtime.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Install the skill",
      text: "Copy the install command for your runtime or clone the skill source.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Set the needed configuration",
      text: "Review the env vars, schedule, and entrypoint before you run it.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Run or schedule it",
      text: "Trigger the entrypoint manually first, then turn on the cron loop.",
    },
  ],
};

export default function SkillsPage() {
  const baseUrl = getSiteUrl();
  const skillsBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Skills", url: `${baseUrl}/skills` },
  ]);
  const skillJsonLd = skills.map((skill) => {
    const commands = getSkillRuntimeCommands(skill, baseUrl);

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
      featureList: [...skill.monitors, ...skill.commands],
      keywords: skill.badges.join(", "),
      url: toAbsoluteUrl(`/skills#${skill.id}`),
      downloadUrl: `${baseUrl}/skills/${skill.id}/skill-md`,
      codeRepository: skill.githubUrl,
      installUrl: commands.openclaw,
    };
  });

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillsBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <SkillsInstallList skills={skills}>
        <section className="grid max-w-5xl gap-6 sm:grid-cols-3 mb-12">
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">01</p>
            <h2 className="type-label text-foreground">Paste the command</h2>
            <p className="type-body-sm text-muted-foreground">
              Copy the install command for your runtime or clone the skill
              source.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">02</p>
            <h2 className="type-label text-foreground">Review the setup</h2>
            <p className="type-body-sm text-muted-foreground">
              Check the env vars, schedule, and entrypoint before you run it.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">03</p>
            <h2 className="type-label text-foreground">Run the skill</h2>
            <p className="type-body-sm text-muted-foreground">
              Trigger the entrypoint once, then move it onto a schedule.
            </p>
          </div>
        </section>
      </SkillsInstallList>
    </div>
  );
}
