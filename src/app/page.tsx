"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HomeLiveCards } from "@/components/home-live-cards";
import { skills } from "@/lib/skills";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-12 pb-4 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live on Zora (Base)
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Discover Zora. Arm your agent.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Verified skills, live market data, and public leaderboards for
          Zora-native agents. One-click install. Read-only. Open source.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/skills" className={buttonVariants({ size: "lg" })}>
            Browse skills
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Watch live
          </Link>
        </div>
      </section>

      {/* Live data cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Zora Network Activity</h2>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
        <HomeLiveCards />
      </section>

      <Separator />

      {/* Skills preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Verified Skills</h2>
            <p className="text-sm text-muted-foreground">
              First-party, open-source, read-only. Install in one command.
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
              className="hover:border-foreground/20 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{skill.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal text-green-600 dark:text-green-400"
                  >
                    {skill.riskLabel}
                  </Badge>
                </div>
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
                <Link
                  href={`/skills#${skill.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-full",
                  })}
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Waitlist */}
      <section className="text-center space-y-4 pb-12">
        <h2 className="text-lg font-semibold">Stay in the loop</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Get notified when new skills launch, execution-capable skills ship,
          and the leaderboard goes live.
        </p>
        <form className="flex items-center gap-2 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="you@example.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit">Notify me</Button>
        </form>
      </section>
    </div>
  );
}
