import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeLiveCards } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { HomeGetStarted } from "@/components/home-get-started";
import { HomeWorksWith } from "@/components/home-works-with";
import { ActivityTickerSection } from "@/components/activity-ticker-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { skills } from "@/lib/skills";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";

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

function HomeLiveCardsSkeleton() {
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2 px-4 py-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Activity ticker — full-bleed, breaks out of max-w container */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-0">
        <ActivityTickerSection />
      </div>

      {/* Hero */}
      <HeroSection />

      {/* Skills preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-body-sm font-medium text-muted-foreground">Skills</h2>
            <p className="type-caption mt-1 text-muted-foreground">
              We wrote and reviewed every one. Published source, one-command install.
            </p>
          </div>
          <AnimatedArrowLink href="/skills">
            View all
          </AnimatedArrowLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.slice(0, 4).map((skill) => (
            <Card
              key={skill.id}
              className="border-border bg-foreground/5 text-foreground hover:border-foreground/15 hover:bg-foreground/[0.07]"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="type-card-title-sans">{skill.name}</h3>
                  <span className="type-caption text-muted-foreground">{skill.installs.toLocaleString()} installs</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="type-body-sm text-muted-foreground">
                  {skill.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {skill.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant={badge === "Execution" ? "default" : "outline"}
                      className={`type-caption font-normal ${
                        badge === "Execution"
                          ? "border-[#3FFF00]/40 bg-[#3FFF00]/14 text-foreground"
                          : "border-border bg-background/70 text-foreground/78"
                      }`}
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Get started steps */}
      <HomeGetStarted />

      {/* Works with */}
      <HomeWorksWith />

      {/* Live data cards */}
      <section className="space-y-4">
        <h2 className="type-body-sm font-medium text-muted-foreground">Agent activity</h2>
        <Suspense fallback={<HomeLiveCardsSkeleton />}>
          <HomeLiveCardsSection />
        </Suspense>
      </section>
    </div>
  );
}
