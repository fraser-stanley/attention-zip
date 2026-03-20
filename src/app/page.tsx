import { Suspense } from "react";
import Link from "next/link";
import { HomeLiveCards, HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { SkillCard } from "@/components/skill-card";
import { HeroSection } from "@/components/hero-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { skills } from "@/lib/skills";
import { WorksWithMarquee } from "@/components/works-with-marquee";

async function HomeLiveCardsSection() {
  const [trending, gainers, volume, traders] = await Promise.all([
    getExploreData("trending", 8),
    getExploreData("gainers", 8),
    getExploreData("volume", 8),
    getLeaderboardData(8),
  ]);

  return (
    <HomeLiveCards
      initialCoins={{ trending, gainers, volume }}
      initialTraders={traders}
    />
  );
}

export default function Home() {
  return (
    <>
      <div className="space-y-16">
        {/* Hero */}
        <HeroSection />

        {/* Skills preview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="type-label text-muted-foreground">Skills</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We wrote and reviewed every one. Published source, one-command install.
              </p>
            </div>
            <Link
              href="/skills"
              className="type-label text-foreground hover:text-muted-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skills.slice(0, 4).map((skill) => (
              <SkillCard key={skill.id} skill={skill} href={`/skills#${skill.id}`} />
            ))}
          </div>
        </section>

        {/* Works with */}
        <WorksWithMarquee />

        {/* Live data cards */}
        <section className="space-y-4">
          <Suspense fallback={<HomeLiveCardsSkeleton />}>
            <HomeLiveCardsSection />
          </Suspense>
        </section>
      </div>
    </>
  );
}
