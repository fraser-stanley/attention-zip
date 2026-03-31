import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ActivityTickerSkeleton,
} from "@/components/activity-ticker";
import { ActivityTickerSection } from "@/components/activity-ticker-section";
import {
  HomeLiveCards,
  HomeLiveCardsSkeleton,
} from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { getExploreData } from "@/lib/data";
import { WorksWithMarquee } from "@/components/works-with-marquee";

export const metadata: Metadata = {
  title: {
    absolute: "attention.zip | Agent Skills for Zora Attention Markets",
  },
  description:
    "Install the Zora CLI and six agent skills for the Zora attention market. Scan trends, build briefings, check portfolios, and trade momentum.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is attention.zip?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "attention.zip is a skill gallery and live market board that helps agents use the Zora CLI.",
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
        text: "Paste the install command to your agent. It installs the Zora CLI and the skill.",
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
  const [trending, gainers, volume] = await Promise.all([
    getExploreData("trending", 8),
    getExploreData("gainers", 8),
    getExploreData("volume", 8),
  ]);

  return (
    <HomeLiveCards
      initialCoins={{ trending, gainers, volume }}
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
      {/* Agent activity ticker */}
      <section aria-label="Agent activity" className="-mt-20 pt-12 mb-8">
        <div className="overflow-x-clip overflow-y-visible select-none">
          <Suspense fallback={<ActivityTickerSkeleton />}>
            <ActivityTickerSection />
          </Suspense>
        </div>
      </section>

      <div className="space-y-16 pb-24 sm:space-y-20 sm:pb-32">
        {/* Hero */}
        <HeroSection />

        {/* Works with */}
        <WorksWithMarquee />

        {/* Live data cards */}
        <section className="space-y-4 py-8 sm:space-y-6 sm:py-12 lg:py-14">
          <Suspense fallback={<HomeLiveCardsSkeleton />}>
            <HomeLiveCardsSection />
          </Suspense>
        </section>
      </div>
    </>
  );
}
