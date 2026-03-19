import { HomeLiveCardsSkeleton } from "@/components/home-live-cards";
import { HeroSection } from "@/components/hero-section";
import { ActivityTickerSection } from "@/components/activity-ticker-section";

export default function HomeLoading() {
  return (
    <>
      <ActivityTickerSection />
      <div className="space-y-16">
        <HeroSection />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>
              <p className="text-xs text-muted-foreground mt-1">
                We wrote and reviewed every one. Published source, one-command install.
              </p>
            </div>
          </div>
        </section>

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
