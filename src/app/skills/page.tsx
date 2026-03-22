import type { Metadata } from "next";
import { SkillsInstallList } from "@/components/skill-card-client";
import { getSkillRuntimeCommands, skills } from "@/lib/skills";
import { getSiteUrl, toAbsoluteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Verified Agent Skills for Zora",
  description:
    "Browse verified agent skills for the Zora attention market. Trending coins, creator analytics, market briefs, portfolio tracking, and momentum trading.",
  alternates: { canonical: "/skills" },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to install an agent skill for Zora",
  description:
    "Install a verified agent skill in your AI coding agent.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Paste the command",
      text: "Copy the command for your runtime. Runs in your terminal.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Your agent reads the skill",
      text: "It fetches the SKILL.md and learns the commands.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Try it",
      text: "Ask a question. The skill handles the rest.",
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
