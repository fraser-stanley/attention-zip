import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeLiveCards } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { ActivityTicker, type ActivityItem } from "@/components/activity-ticker";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { formatCompactCurrency, formatChange, type CoinNode } from "@/lib/zora";
import { skills } from "@/lib/skills";

function coinToItem(coin: CoinNode, type: "trending" | "gainers" | "new"): ActivityItem {
  const value = formatCompactCurrency(coin.marketCap);
  if (type === "trending") {
    return { name: coin.name ?? "Unknown", tag: "trending", value, positive: null };
  }
  if (type === "new") {
    return { name: coin.name ?? "Unknown", tag: "new launch", value, positive: null };
  }
  const change = formatChange(coin.marketCap, coin.marketCapDelta24h);
  return { name: coin.name ?? "Unknown", tag: change.value, value, positive: change.positive };
}

async function ActivityTickerSection() {
  const [trending, gainers, newCoins] = await Promise.all([
    getExploreData("trending", 5),
    getExploreData("gainers", 5),
    getExploreData("new", 5),
  ]);

  // Round-robin interleave
  const maxLen = Math.max(trending.length, gainers.length, newCoins.length);
  const items: ActivityItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < trending.length) items.push(coinToItem(trending[i], "trending"));
    if (i < gainers.length) items.push(coinToItem(gainers[i], "gainers"));
    if (i < newCoins.length) items.push(coinToItem(newCoins[i], "new"));
  }

  return <ActivityTicker initialItems={items} />;
}

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
      {/* Hero */}
      <HeroSection />

      {/* Agent activity ticker */}
      <Suspense fallback={null}>
        <ActivityTickerSection />
      </Suspense>

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


      {/* Skills preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>
            <p className="text-xs text-muted-foreground mt-1">
              We wrote these, reviewed them, and published the source. Install in one command.
            </p>
          </div>
          <Link
            href="/skills"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => (
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
                      variant="outline"
                      className="text-xs font-normal"
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


      {/* Waitlist */}
      <section className="text-center space-y-4 pb-16">
        <h2 className="text-sm font-medium text-muted-foreground">Stay in the loop</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          We'll email you when new skills drop or when buy/sell execution ships.
        </p>
        <form className="flex items-center gap-2 max-w-sm mx-auto">
          <Input
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <Button type="submit">Notify me</Button>
        </form>
      </section>
    </div>
  );
}
