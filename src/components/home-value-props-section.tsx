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
