import { platforms, type Platform } from "@/lib/platforms";
import { PlatformLogo } from "@/components/platform-logos";

function PlatformItems({ items }: { items: Platform[] }) {
  return (
    <>
      {items.map((platform) => (
        <a
          key={platform.id}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          title={platform.name}
          className="flex items-center gap-2 px-6 shrink-0 text-foreground/40 transition-[transform,color] duration-150 ease will-change-transform hover:scale-[1.06] hover:text-foreground/70 focus-visible:scale-[1.06] focus-visible:text-foreground/70 focus-visible:outline-none"
        >
          <PlatformLogo
            id={platform.id}
            size={28}
          />
          <span className="text-[16px] whitespace-nowrap">
            {platform.name}
          </span>
        </a>
      ))}
    </>
  );
}

export function WorksWithMarquee() {
  return (
    <section aria-label="Compatible platforms" className="space-y-3">
      <h2 className="type-body-sm font-medium text-muted-foreground">
        Works with
      </h2>
      <div className="overflow-x-clip overflow-y-visible select-none">
        <nav
          aria-label="Compatible agent platforms"
          className="logo-marquee-track"
        >
          <div className="flex shrink-0">
            <PlatformItems items={platforms} />
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            <PlatformItems items={platforms} />
          </div>
        </nav>
      </div>
    </section>
  );
}
