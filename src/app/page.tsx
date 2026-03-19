import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeLiveCards, HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { skills } from "@/lib/skills";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";
import { ActivityTickerSection } from "@/components/activity-ticker-section";

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
      <ActivityTickerSection />
      <div className="space-y-16">
        {/* Hero */}
        <HeroSection />

        {/* Skills preview */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We wrote and reviewed every one. Published source, one-command install.
              </p>
            </div>
            <AnimatedArrowLink href="/skills">
              View all
            </AnimatedArrowLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {skills.slice(0, 4).map((skill) => (
              <Link key={skill.id} href={`/skills#${skill.id}`} className="block">
                <Card className="h-full hover:border-foreground/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{skill.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {skill.description}
                    </p>
                    <span className="type-caption text-muted-foreground font-mono">
                      {skill.installs.toLocaleString()} installs
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Live data cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Agent activity</h2>
            <span className="text-xs text-muted-foreground font-mono">Live</span>
          </div>
          <Suspense fallback={<HomeLiveCardsSkeleton />}>
            <HomeLiveCardsSection />
          </Suspense>
        </section>
      </div>
    </>
  );
}
