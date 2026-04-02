import Link from "next/link";
import { SITE_REPO_URL } from "@/lib/site";
import { AnimatedExternalLink } from "@/components/animated-external-link";
import { FooterLogoButton } from "@/components/footer-logo-button";

const columns = [
  {
    title: "Pages",
    links: [
      { label: "Skills", href: "/skills" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Portfolio", href: "/portfolio" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "GitHub", href: SITE_REPO_URL, external: true },
      { label: "Zora CLI Docs", href: "https://cli.zora.com/", external: true },
      { label: "Add Your Skill", href: `${SITE_REPO_URL}/blob/main/CONTRIBUTING.md`, external: true },
      { label: "API Discovery", href: "/api" },
      { label: "Skill Catalog", href: "/api/skills" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-32 border-t border-background/10 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 mb-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label mb-3 text-background/50">
                {col.title}
              </h2>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <AnimatedExternalLink
                        href={link.href}
                        iconSize={12}
                        srLabel="(opens in new tab)"
                        className="type-caption gap-1 font-mono text-background/70 transition-colors duration-150 hover:text-background"
                      >
                        {link.label}
                      </AnimatedExternalLink>
                    ) : (
                      <Link
                        href={link.href}
                        className="type-caption font-mono text-background/70 transition-colors duration-150 hover:text-background"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FooterLogoButton />
      </div>
    </footer>
  );
}
