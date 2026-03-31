import Link from "next/link";
import { SITE_REPO_URL } from "@/lib/site";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";

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
      { label: "Zora CLI Docs", href: "https://docs.zora.co", external: true },
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
        </div>

        <div className="pt-12">
          <svg
            viewBox="0 0 607 107"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            aria-hidden="true"
          >
            <defs>
              <filter id="dither-logo-footer" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.65"
                  numOctaves="4"
                  seed="0"
                  result="noise"
                >
                  <animate
                    attributeName="seed"
                    values="0;100"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="3"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
            <g fill="currentColor" className="text-background" filter="url(#dither-logo-footer)">
              <path d="M586.862 19.0801C601.262 19.0801 606.303 30.5999 606.303 54.5996C606.303 79.4394 598.383 87.3602 586.383 87.3604C580.263 87.3604 575.102 85.0802 572.822 78.3604H572.582V106.8H550.982V20.7598H571.862V29.6396H572.103C574.623 22.56 579.543 19.0801 586.862 19.0801ZM27.3604 19.0801C42.4801 19.0801 53.04 23.1602 53.04 39.96V71.6396C53.04 77.7595 53.2802 82.3197 55.0801 85.6797H34.2002C33.3603 83.3999 33.2398 81.1201 32.8799 78.3604H32.6396C30.2396 84.1201 24.5999 87.3604 18 87.3604C4.92008 87.3604 5.78063e-05 79.3202 0 68.2803C0 56.2803 4.20006 50.6404 18 47.4004L26.5195 45.3604C31.1995 44.2804 32.8798 42.2401 32.8799 38.2803C32.8799 34.3204 31.0801 32.2804 27.3604 32.2803C23.1604 32.2803 21.3603 34.0801 21.2402 40.9199H2.51953C2.51961 22.2001 17.5204 19.0801 27.3604 19.0801ZM159.623 19.0801C176.903 19.0801 185.663 26.7603 185.663 50.2803V56.8799H153.623V65.4004C153.623 72.4801 156.504 74.1602 159.504 74.1602C163.344 74.16 165.623 71.7595 165.623 62.8799H185.063C184.703 78.7199 177.503 87.3604 159.623 87.3604C138.863 87.3602 132.023 77.88 132.023 53.2803C132.023 28.4404 140.063 19.0802 159.623 19.0801ZM344.529 19.0801C369.849 19.0801 372.13 34.5603 372.13 53.2803C372.13 70.2002 368.889 87.3604 344.529 87.3604C319.21 87.3602 316.93 71.88 316.93 53.1602C316.93 36.2402 320.17 19.0803 344.529 19.0801ZM84.96 20.7598H100.212V1.67969H121.812V20.7598H130.332V35.2793H121.812V66.2393C121.812 69.9592 123.492 71.2793 126.972 71.2793H130.332V85.6797C126.372 86.1597 122.291 86.3994 118.571 86.3994C105.492 86.3994 100.212 84.2395 100.212 69.8398V35.2793H84.96V66.2393C84.96 69.9592 86.6401 71.2793 90.1201 71.2793H93.4805V85.6797C89.5205 86.1597 85.4397 86.3994 81.7197 86.3994C68.6401 86.3994 63.3604 84.2395 63.3604 69.8398V35.2793H56.1602V20.7598H63.3604V1.67969H84.96V20.7598ZM276.78 20.7598H285.301V35.2793H276.78V66.2393C276.78 69.9592 278.46 71.2793 281.94 71.2793H285.301V85.6797C281.341 86.1597 277.26 86.3994 273.54 86.3994C260.46 86.3994 255.181 84.2396 255.181 69.8398V35.2793H247.98V20.7598H255.181V1.67969H276.78V20.7598ZM227.557 19.0801C237.037 19.0801 244.476 22.8 244.477 36.7197V85.6797H222.877V42.8398C222.877 37.44 221.437 35.1602 217.597 35.1602C213.757 35.1602 212.316 37.4401 212.316 42.8398V85.6797H190.717V20.7598H211.597V28.6797H211.837C214.597 22.32 219.997 19.0801 227.557 19.0801ZM310.871 85.6797H289.271V20.7598H310.871V85.6797ZM414.689 19.0801C424.169 19.0801 431.609 22.8 431.609 36.7197V85.6797H410.01V42.8398C410.01 37.44 408.569 35.1602 404.729 35.1602C400.89 35.1602 399.449 37.4401 399.449 42.8398V85.6797H377.85V20.7598H398.729V28.6797H398.97C401.73 22.32 407.13 19.0801 414.689 19.0801ZM460.553 85.6797H440.393V61.9199H460.553V85.6797ZM516.045 36.8398L491.805 68.8799H516.645V85.6797H466.725V68.8799L490.005 37.5596H467.805V20.7598H516.045V36.8398ZM543.645 85.6797H522.045V20.7598H543.645V85.6797ZM344.529 33C339.73 33.0002 338.529 36.8407 338.529 53.2803C338.529 69.5997 339.73 73.4402 344.529 73.4404C349.449 73.4404 350.529 69.6001 350.529 53.2803C350.529 36.8403 349.449 33 344.529 33ZM32.6396 54.3604C31.3196 56.1599 28.56 55.9205 25.3203 57.3604C21.9604 58.9203 20.8799 61.44 20.8799 65.7598C20.8799 70.0798 22.9202 72.8398 26.1602 72.8398C30.96 72.8398 32.8799 69.36 32.8799 62.1602V54.3604H32.6396ZM578.582 35.1602C573.662 35.1604 572.582 39.2406 572.582 53.1602C572.582 67.1997 573.662 71.28 578.582 71.2803C583.742 71.2803 584.702 67.2001 584.702 53.1602C584.702 39.2402 583.742 35.1602 578.582 35.1602ZM159.504 32.2803C155.064 32.2803 153.623 35.4002 153.623 42.2402V45.1201H165.504V42.2402C165.504 35.4005 164.184 32.2805 159.504 32.2803ZM310.871 16.0801H289.271V0H310.871V16.0801ZM543.645 16.0801H522.045V0H543.645V16.0801Z"/>
            </g>
          </svg>
        </div>
      </div>
    </footer>
  );
}
