import type { Metadata } from "next";
import { SkillsInstallList } from "@/components/skill-card-client";
import { skills } from "@/lib/skills";
import { getSiteUrl, toAbsoluteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Install Zora Market Skills",
  description:
    "Install agent skills for the Zora attention market. Scan trends, check portfolios, build briefings, and trade momentum.",
  alternates: { canonical: "/skills" },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to install an agent skill for Zora",
  description: "Install a Zora market skill in your agent runtime.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Install",
      text: "Copy the command for your agent runtime.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Set up",
      text: "Read the skill notes. Add a wallet only if the skill needs one.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Run",
      text: "Run it once. Put it on a schedule later if you want.",
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
            <h2 className="type-label text-foreground">Install</h2>
            <p className="type-body-sm text-muted-foreground">
              Copy the command for your agent runtime.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">02</p>
            <h2 className="type-label text-foreground">Set up</h2>
            <p className="type-body-sm text-muted-foreground">
              Read the skill notes. Add a wallet only if the skill needs one.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="type-label text-muted-foreground">03</p>
            <h2 className="type-label text-foreground">Run</h2>
            <p className="type-body-sm text-muted-foreground">
              Run it once. Put it on a schedule later if you want.
            </p>
          </div>
        </section>
      </SkillsInstallList>
    </div>
  );
}
