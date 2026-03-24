import Link from "next/link";
import { SITE_REPO_URL, API_VERSION } from "@/lib/site";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";

const columns = [
  {
    title: "Pages",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Skills", href: "/skills" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: SITE_REPO_URL, external: true },
      { label: ".well-known/ai.json", href: "/.well-known/ai.json" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API Discovery", href: "/api" },
      { label: "Skill Catalog", href: "/api/skills" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-background/10 bg-foreground text-background mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between border-b border-background/10 pb-6 mb-6">
          <span className="type-label text-background/50">
            Attention Index
          </span>
          <span className="type-caption font-mono text-background/50">
            v{API_VERSION}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label mb-3 text-background/50">
                {col.title}
              </h2>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-caption inline-flex items-center gap-1 font-mono text-background/70 transition-colors duration-150 hover:text-background"
                      >
                        {link.label}
                        <ArrowUpRightIcon aria-hidden="true" size={12} />
                        <span className="sr-only">(opens in new tab)</span>
                      </a>
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

          <div>
            <h2 className="type-label mb-3 text-background/50">
              Legal
            </h2>
            <p className="type-caption font-mono text-background/70">
              Open source. No custody. Some skills need a wallet.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-background/10 flex items-center justify-between">
          <p className="type-caption font-mono text-background/50">
            &copy; {new Date().getFullYear()} Attention Index
          </p>
          <p className="type-caption font-mono text-background/50">
            Trading is opt-in.
          </p>
        </div>
      </div>
    </footer>
  );
}
