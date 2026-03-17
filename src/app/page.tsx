import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeLiveCards } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { HomeValuePropsSection } from "@/components/home-value-props-section";
import { ActivityTickerSection } from "@/components/activity-ticker-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { skills } from "@/lib/skills";
import { AnimatedArrowLink } from "@/components/animated-arrow-link";

async function HomeLiveCardsSection() {
  const [trending, gainers, volume, traders] = await Promise.all([
    getExploreData("trending", 3),
    getExploreData("gainers", 3),
    getExploreData("volume", 3),
    getLeaderboardData(3),
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
      ))}
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

      <HomeValuePropsSection />

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
            <Card
              key={skill.id}
              className="hover:border-foreground/30"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{skill.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {skill.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {skill.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant={badge === "Execution" ? "default" : "outline"}
                      className={`text-xs font-normal ${badge === "Execution" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : ""}`}
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
  );
}
