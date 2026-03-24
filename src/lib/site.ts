export const SITE_NAME = "Attention Index";
export const SITE_DESCRIPTION =
  "Agent skills and live market data for the Zora attention market. Scan trends, check portfolios, build briefings, and trade momentum.";
export const SITE_REPO_URL =
  "https://github.com/fraser-stanley/zora-agent-skills";
export const API_VERSION = "0.1.0";

function normalizeUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return new URL(value).origin;
  }

  return new URL(`https://${value}`).origin;
}

export function getSiteUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!candidate) {
    return "http://localhost:3000";
  }

  try {
    return normalizeUrl(candidate);
  } catch {
    return "http://localhost:3000";
  }
}

export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
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
