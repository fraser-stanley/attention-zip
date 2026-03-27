import { skills } from "@/lib/skills";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_REPO_REF,
  getDocumentationUrl,
  getSiteRepoUrl,
  toAbsoluteUrl,
} from "@/lib/site";

function skillLinks(siteUrl: string) {
  return skills
    .map(
      (skill) =>
        `- [${skill.name}](${toAbsoluteUrl(
          `/skills/${skill.id}/skill-md`,
          siteUrl,
        )}): ${skill.description}`,
    )
    .join("\n");
}

function skillReferenceLines(siteUrl: string) {
  return skills
    .map((skill) => {
      const sourceLine = `Source: ${skill.githubUrl}`;
      return [
        `### ${skill.name}`,
        skill.longDescription,
        `Skill URL: ${toAbsoluteUrl(`/skills/${skill.id}/skill-md`, siteUrl)}`,
        sourceLine,
        `Requires: ${skill.requires.bins.join(", ")}${
          skill.requires.env.length > 0
            ? ` | env: ${skill.requires.env.join(", ")}`
            : ""
        }`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildAiDiscovery(siteUrl: string) {
  return {
    name: SITE_NAME,
    description: "Verified skills for Zora-native agents",
    api: "/api",
    skills_endpoint: "/api/skills",
    explore_endpoint: "/api/explore",
    leaderboard_endpoint: "/api/leaderboard",
    portfolio_endpoint: "/api/portfolio",
    llms_txt: "/llms.txt",
    llms_full_txt: "/llms-full.txt",
    documentation: getDocumentationUrl(siteUrl),
    source_repository: getSiteRepoUrl(),
  };
}

export function buildLlmsTxt(siteUrl: string) {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Documentation

- [Full docs (for agents)](${getDocumentationUrl(siteUrl)}): Complete reference in one file
- [Skill catalog API](${toAbsoluteUrl("/api/skills", siteUrl)}): JSON skill catalog
- [API discovery](${toAbsoluteUrl("/api", siteUrl)}): All endpoints
- [Agent discovery](${toAbsoluteUrl("/.well-known/ai.json", siteUrl)}): Machine-readable metadata

## Skills

${skillLinks(siteUrl)}
`;
}

export function buildLlmsFullTxt(siteUrl: string) {
  const repoUrl = getSiteRepoUrl();

  return `# ${SITE_NAME}

${SITE_DESCRIPTION}

This site hosts installable skill instructions for the Zora attention market. Prefer the site-hosted \`/skills/<id>/skill-md\` URLs when telling an agent what to read.

## Core Docs

- Full docs: ${getDocumentationUrl(siteUrl)}
- API discovery: ${toAbsoluteUrl("/api", siteUrl)}
- Skill catalog: ${toAbsoluteUrl("/api/skills", siteUrl)}
- Agent discovery: ${toAbsoluteUrl("/.well-known/ai.json", siteUrl)}
- Source repository: ${repoUrl}

## Skills

${skillReferenceLines(siteUrl)}

## API Endpoints

Base URL: ${siteUrl}

| Endpoint | Description | Params |
|----------|-------------|--------|
| GET /api | API discovery document | — |
| GET /api/skills | Skill catalog JSON | \`id\` (optional, e.g. \`trend-scout\`) |
| GET /api/explore | Live coin data by sort | \`sort\` (\`trending|mcap|new|volume|gainers|creators|featured|last-traded|last-traded-unique\`), \`count\` (1-20) |
| GET /api/leaderboard | Weekly trader rankings by Zora volume | \`count\` (1-50) |
| GET /api/portfolio | Public Zora coin balances for a wallet address | \`address\` (0x wallet address), \`count\` (1-50) |

## Install a Skill

Tell your agent:
\`\`\`
Read ${toAbsoluteUrl("/skills/<skill-slug>/skill-md", siteUrl)}. Use ${repoUrl}/tree/${SITE_REPO_REF}/<skill-slug> for the source files.
\`\`\`

Or clone the source:
\`\`\`
git clone --depth 1 ${repoUrl}
\`\`\`

Available skill slugs: ${skills.map((skill) => skill.id).join(", ")}
`;
}
