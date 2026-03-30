import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ActivityTickerSkeleton,
} from "@/components/activity-ticker";
import {
  HomeLiveCards,
  HomeLiveCardsSkeleton,
} from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { getExploreData, getLeaderboardData } from "@/lib/data";
import { WorksWithMarquee } from "@/components/works-with-marquee";
import { ActivityTickerSection } from "@/components/activity-ticker-section";

export const metadata: Metadata = {
  title: {
    absolute: "Attention Index | Agent Skills for the Zora Attention Market",
  },
  description:
    "Install agent skills for the Zora attention market. Scan trends, build briefings, check portfolios, and trade momentum.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Attention Index?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Attention Index is a skill gallery and live market board that helps agents use the Zora attention market.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Zora attention market?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zora is an attention market on Base where profiles, posts, and trends can trade as coins.",
      },
    },
    {
      "@type": "Question",
      name: "What are agent skills?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Skills your agent can install to scan, track, or trade the Zora attention market. Each one links to source and skill notes.",
      },
    },
    {
      "@type": "Question",
      name: "How do I install a skill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste the install command to your agent, then read the skill notes.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a wallet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Trend Scout, Creator Pulse, and Briefing Bot work without one. Portfolio Scout, Copy Trader, and Momentum Trader need a wallet. Use a dedicated wallet for trading.",
      },
    },
    {
      "@type": "Question",
      name: "Is this open source?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The skills are open source. Each one links to source and skill notes.",
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
          <Suspense fallback={<ActivityTickerSkeleton />}>
            <ActivityTickerSection />
          </Suspense>
        </div>
      </section>

      <div className="space-y-16">
        {/* Hero */}
        <HeroSection />

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
