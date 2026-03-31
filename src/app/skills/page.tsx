import type { Metadata } from "next";
import { SkillsInstallList } from "@/components/skill-card-client";
import { skills } from "@/lib/skills";
import { getSiteUrl, toAbsoluteUrl, breadcrumbJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  title: "Install Zora Market Skills",
  description:
    "Agent skills for the Zora attention market. Scan trends, copy trades, and track portfolios. Works with Claude Code, Cursor, Codex, and OpenClaw.",
  alternates: { canonical: "/skills" },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to install an agent skill for Zora",
  description: "Install a Zora market skill with your agent.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Paste",
      text: "Paste the command to your agent.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Read",
      text: "Read the skill notes. Add a wallet only if the skill needs one.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Run",
      text: "Run the skill. Put it on a schedule later if you want.",
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
      <SkillsInstallList skills={skills} />
    </div>
  );
}
