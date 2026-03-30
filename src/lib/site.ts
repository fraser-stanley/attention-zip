export const SITE_NAME = "attention.zip";
export const SITE_DESCRIPTION =
  "Install agent skills for the Zora attention market.";
export const API_VERSION = "0.1.0";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_REPO_URL =
  "https://github.com/fraser-stanley/zora-agent-skills";
const DEFAULT_SITE_REPO_REF = "main";

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return new URL(value).origin;
  }

  return new URL(`https://${value}`).origin;
}

function getEnvSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL
  );
}

export function getSiteUrl(requestUrl?: string) {
  const candidate =
    requestUrl ??
    getEnvSiteUrl() ??
    (typeof window !== "undefined" ? window.location.origin : undefined);

  if (!candidate) {
    return DEFAULT_SITE_URL;
  }

  try {
    return normalizeUrl(candidate);
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteRepoUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_REPO_URL ??
    process.env.SITE_REPO_URL ??
    DEFAULT_SITE_REPO_URL
  );
}

export function getSiteRepoRef() {
  return (
    process.env.NEXT_PUBLIC_SITE_REPO_REF ??
    process.env.SITE_REPO_REF ??
    DEFAULT_SITE_REPO_REF
  );
}

export function getSiteRepoName() {
  try {
    const pathname = new URL(getSiteRepoUrl()).pathname.replace(/\/$/, "");
    const repoName = pathname.split("/").pop();
    return repoName?.replace(/\.git$/, "") || "zora-agent-skills";
  } catch {
    return "zora-agent-skills";
  }
}

export const SITE_REPO_URL = getSiteRepoUrl();
export const SITE_REPO_REF = getSiteRepoRef();

export function toAbsoluteUrl(pathname: string, requestUrl?: string) {
  return new URL(pathname, getSiteUrl(requestUrl)).toString();
}

export function getDocumentationUrl(requestUrl?: string) {
  return toAbsoluteUrl("/llms-full.txt", requestUrl);
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
