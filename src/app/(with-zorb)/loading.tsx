import { HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { ActivityTickerSkeleton } from "@/components/activity-ticker";
import { WorksWithMarquee } from "@/components/works-with-marquee";

export default function HomeLoading() {
  return (
    <>
      <div className="-mt-20 pt-12 mb-8">
        <ActivityTickerSkeleton />
      </div>
      <div className="space-y-16">
        <HeroSection />
        <WorksWithMarquee />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Agent activity</h2>
            <span className="text-xs text-muted-foreground font-mono">Live</span>
          </div>
          <HomeLiveCardsSkeleton />
        </section>
      </div>
    </>
  );
}
