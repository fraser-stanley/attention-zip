import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SkillInstallBlock,
  SkillSampleOutput,
} from "@/components/skill-card-client";
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
      installUrl: install.claude,
    };
  });

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Each skill is a SKILL.md file we wrote and reviewed. Install it
          into your OpenClaw or Claude Code agent in one command.
        </p>
      </div>

      <div className="space-y-8">
        {skills.map((skill) => (
          <Card key={skill.id} id={skill.id} className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{skill.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {skill.longDescription}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal text-green-600 dark:text-green-500 shrink-0 ml-4"
                >
                  {skill.riskLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <SkillInstallBlock skill={skill} />

              {/* Monitors */}
              <div>
                <h3 className="text-sm font-medium mb-2">What it monitors</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {skill.monitors.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CLI commands wrapped */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  CLI commands wrapped
                </h3>
                <div className="space-y-1">
                  {skill.wraps.map((cmd) => (
                    <code
                      key={cmd}
                      className="block text-xs bg-muted px-3 py-1.5 font-mono"
                    >
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                {skill.badges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>

              <Separator />

              <SkillSampleOutput skill={skill} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
