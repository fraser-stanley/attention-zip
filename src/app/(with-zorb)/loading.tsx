import { HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { WorksWithMarquee } from "@/components/works-with-marquee";

export default function HomeLoading() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <WorksWithMarquee />

      <section className="space-y-4">
        <HomeLiveCardsSkeleton />
      </section>
    </div>
  );
}
