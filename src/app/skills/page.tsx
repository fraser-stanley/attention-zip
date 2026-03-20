import type { Metadata } from "next";
import { SkillsInstallList } from "@/components/skill-card-client";
import { getSkillRuntimeCommands, skills } from "@/lib/skills";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Browse verified agent skills for the Zora attention market. Trending coins, creator analytics, market briefs, portfolio tracking, and momentum trading.",
};

export default function SkillsPage() {
  const baseUrl = getSiteUrl();
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
      featureList: [...skill.monitors, ...skill.wraps],
      keywords: skill.badges.join(", "),
      url: toAbsoluteUrl(`/skills#${skill.id}`),
      downloadUrl: `${baseUrl}/skills/${skill.id}/skill-md`,
      codeRepository: skill.githubUrl,
      installUrl: commands.claude,
    };
  });

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <SkillsInstallList skills={skills}>
        <section className="grid max-w-5xl gap-6 sm:grid-cols-3 mb-12">
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">01</p>
            <h2 className="type-label text-foreground">Paste the command</h2>
            <p className="type-body-sm text-muted-foreground">
              Copy the command for your runtime. Runs in your terminal.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">02</p>
            <h2 className="type-label text-foreground">Your agent reads the skill</h2>
            <p className="type-body-sm text-muted-foreground">
              It fetches the SKILL.md and learns the commands.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">03</p>
            <h2 className="type-label text-foreground">Try it</h2>
            <p className="type-body-sm text-muted-foreground">
              Ask a question. The skill handles the rest.
            </p>
          </div>
        </section>
      </SkillsInstallList>
    </div>
  );
}
