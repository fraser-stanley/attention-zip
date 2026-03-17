import { SkillsInstallList } from "@/components/skill-card-client";
import { Callout } from "@/components/ui/callout";
import { Step, Steps } from "@/components/ui/steps";
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
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(skillJsonLd) }}
      />
      <div>
        <h1 className="text-4xl tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Each skill is a SKILL.md file we wrote and reviewed. Install into your
          agent in one command.
        </p>
      </div>

      <Callout variant="check" title="Verified source with explicit risk labels">
        <p>
          Every install path on this page points back to published source. Most
          skills are read-only, and any execution-capable skill is labeled
          clearly so you can review it and isolate it to a dedicated trader
          wallet before enabling it.
        </p>
      </Callout>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium">Install flow</h2>
          <p className="text-sm text-muted-foreground">
            The install UI is structured like docs: choose a runtime, copy the
            command, then verify what your agent will run.
          </p>
        </div>

        <Steps>
          <Step title="Choose the runtime your agent already uses">
            <p>
              Switch between <strong>Zora CLI</strong>, <strong>OpenClaw</strong>,
              or a manual <code>curl</code> install without leaving the page.
            </p>
          </Step>
          <Step title="Copy the command for the specific skill">
            <p>
              Each skill exposes the matching install command plus the source
              links you need to inspect before enabling it locally.
            </p>
          </Step>
          <Step title="Verify the skill scope before enabling it">
            <p>
              Read-only skills can stay in scout mode. Execution-capable skills
              should only run in a dedicated trader wallet with bounded funds.
            </p>
          </Step>
        </Steps>
      </section>

      <SkillsInstallList skills={skills} />
    </div>
  );
}
