const valueProps = [
  {
    title: "Read the skill before it runs",
    description: (
      <>
        Every install path points to a readable
        <code className="mx-1 bg-muted px-1.5 py-0.5 text-[0.95em]">
          SKILL.md
        </code>
        you can inspect first.
      </>
    ),
  },
  {
    title: "Start without keys",
    description:
      "Trends, creators, briefings, and portfolio reads stay in scout mode until you choose otherwise.",
  },
  {
    title: "Keep risk explicit",
    description:
      "Momentum Trader is labeled separately and belongs in a dedicated trader wallet with bounded funds.",
  },
] as const;

export function HomeValuePropsSection() {
  return (
    <section aria-labelledby="home-value-props-title" className="space-y-6">
      <h2 id="home-value-props-title" className="sr-only">
        Why start here
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {valueProps.map((item) => (
          <div
            key={item.title}
            className="min-h-[18rem] border border-border bg-card p-6 transition-colors duration-200 hover:border-foreground/20"
          >
            <div className="space-y-5">
              <p className="max-w-[12ch] font-display text-hero font-medium leading-[1.1] tracking-tighter text-foreground">
                {item.title}
              </p>
              <p className="max-w-[29ch] text-[1.05rem] leading-8 text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
