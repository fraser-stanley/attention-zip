import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { HomeLiveCards, HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { SkillCard } from "@/components/skill-card";
import { HeroSection } from "@/components/hero-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { skills } from "@/lib/skills";
import { WorksWithMarquee } from "@/components/works-with-marquee";
import { ActivityTickerSection } from "@/components/activity-ticker-section";

export const metadata: Metadata = {
  title: {
    absolute: "Attention Index | Agent Skills for the Zora Attention Market",
  },
  description:
    "Agent skills for the Zora attention market. Trending coins, creator analytics, market digests, portfolio tracking, and momentum trading. Open source, no custody.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the Zora attention market?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zora is an attention market where anyone can create and trade coins around content, trends, and creators on Base.",
      },
    },
    {
      "@type": "Question",
      name: "What are agent skills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agent skills are structured instructions that teach AI coding agents (Claude Code, Cursor, Codex) to use the Zora CLI and SDK. Each skill is a SKILL.md file your agent reads and learns from.",
      },
    },
    {
      "@type": "Question",
      name: "How do I install a skill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Copy the one-line command for your runtime from the skills page. Your agent fetches the SKILL.md and learns the commands automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a wallet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Read-only skills (Trend Scout, Creator Pulse, Briefing Bot, Portfolio Scout) work without a wallet. The Momentum Trader skill requires a dedicated wallet created with zora setup.",
      },
    },
    {
      "@type": "Question",
      name: "Is this open source?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All skills are published source. No custody, no server-side execution, no paid features.",
      },
    },
  ],
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Agent activity */}
      <section aria-label="Agent activity" className="-mt-20 pt-12 mb-8">
        <div className="overflow-x-clip overflow-y-visible select-none">
          <ActivityTickerSection />
        </div>
      </section>

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
