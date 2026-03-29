const valueProps = [
  {
    title: "Read the skill first",
    description: "Every skill links to its source and notes before it runs.",
  },
  {
    title: "No wallet needed to start",
    description:
      "Trend Scout, Creator Pulse, and Briefing Bot work without one. Add a wallet when you want Portfolio Scout, Copy Trader, or Momentum Trader.",
  },
  {
    title: "Use a trading wallet",
    description: "Use a dedicated wallet for trading skills.",
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
            className="flex flex-col justify-between border border-border bg-card p-6 transition-colors duration-200 hover:border-foreground/20"
          >
            <p className="type-card-title-lg max-w-[12ch] text-foreground">
              {item.title}
            </p>
            <p className="type-body-sm mt-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
