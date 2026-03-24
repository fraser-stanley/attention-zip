import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  HomeLiveCards,
  HomeLiveCardsSkeleton,
} from "@/components/home-live-cards";
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
    "Managed agent skills for the Zora attention market. Trend scans, creator analytics, market digests, portfolio checks, and momentum trading.",
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
        text: "Agent skills are managed Zora workflows. Each one ships with a SKILL.md, a clawhub.json manifest, and an entrypoint script that runs the workflow through the Zora CLI.",
      },
    },
    {
      "@type": "Question",
      name: "How do I install a skill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Copy the install command for your runtime from the skills page, then review the env vars and run the entrypoint once before you schedule it.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a wallet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Trend Scout, Creator Pulse, and Briefing Bot work without a wallet. Portfolio Scout and Momentum Trader use a dedicated wallet created with zora setup or ZORA_PRIVATE_KEY. On macOS, zora wallet backup adds a Keychain-backed recovery path for local wallets.",
      },
    },
    {
      "@type": "Question",
      name: "Is this open source?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All skills are published source. They run through the Zora CLI and store their own local state. No custody or hosted execution layer is built into this site.",
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
                Managed templates with real entrypoints, published source, and
                one-command install.
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
              <SkillCard
                key={skill.id}
                skill={skill}
                href={`/skills#${skill.id}`}
              />
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
