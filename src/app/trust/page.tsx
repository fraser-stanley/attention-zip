const boundaries = [
  "Hold or manage private keys",
  "Submit transactions on your behalf",
  "Enforce execution guardrails server-side",
  "Accept third-party skill submissions",
  "Guarantee trading outcomes",
];

export default function TrustPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-16 pb-20 border-b border-border">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Trust &amp; Safety
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          We publish source.{" "}
          <span className="highlight-block">You control execution.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-7 text-muted-foreground">
          How this works and how to keep your wallet safe.
        </p>
      </section>

      {/* Our model */}
      <section className="py-20 border-b border-border">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Our model
          </p>
          <h2 className="mt-4 text-2xl tracking-tight sm:text-3xl">
            Source-published, locally executed
          </h2>
          <div className="mt-8 space-y-6 text-base leading-7 text-muted-foreground">
            <p>
              We wrote every skill in this repo and published the source. You can
              read the code before you install anything.
            </p>
            <p className="text-foreground text-lg leading-8">
              We don&apos;t hold keys, submit transactions, or control your local
              runtime.
            </p>
            <p>
              Verified means we reviewed the source. It does not mean we
              control your runtime.
            </p>
            <p>
              Execution skills still run in your runtime, under your wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Wallet safety presets */}
      <section className="py-20 border-b border-border">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Wallet safety presets
        </p>
        <h2 className="mt-4 text-2xl tracking-tight sm:text-3xl max-w-2xl">
          Never reuse your personal wallet
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Execution skills like Momentum Trader should only run in a dedicated
          wallet with bounded funds. Most other skills are read-only.
        </p>

        <div className="mt-12 grid gap-px bg-border sm:grid-cols-3">
          <div className="bg-background p-6 sm:p-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              01
            </p>
            <h3 className="mt-3 text-lg font-medium">Scout</h3>
            <p className="mt-1 text-sm font-mono text-[#3FFF00]">
              Read-only, no funds
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Monitoring and alerts only. No wallet needed. Most skills work
              here.
            </p>
          </div>

          <div className="bg-background p-6 sm:p-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              02
            </p>
            <h3 className="mt-3 text-lg font-medium">Trader</h3>
            <p className="mt-1 text-sm font-mono text-foreground">
              Dedicated wallet, execution enabled
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Required for execution skills. Dedicated wallet, limited funds.
              Never your personal wallet.
            </p>
          </div>

          <div className="bg-background p-6 sm:p-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              03
            </p>
            <h3 className="mt-3 text-lg font-medium">Personal</h3>
            <p className="mt-1 text-sm font-mono text-destructive">
              Not recommended
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Never use your personal wallet with agent skills. Create a
              dedicated agent wallet with{" "}
              <code className="bg-muted px-1">zora setup</code>. Keys stored
              locally at{" "}
              <code className="bg-muted px-1">~/.config/zora/wallet.json</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Boundaries */}
      <section className="py-20 border-b border-border">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Boundaries
        </p>
        <h2 className="mt-4 text-2xl tracking-tight sm:text-3xl">
          What we don&apos;t do
        </h2>

        <div className="mt-12 max-w-2xl divide-y divide-border">
          {boundaries.map((item, i) => (
            <div key={i} className="py-4 flex items-baseline gap-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground shrink-0 w-8">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-base leading-7">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Source code */}
      <section className="py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Source code
          </p>
          <h2 className="mt-4 text-2xl tracking-tight sm:text-3xl">
            Read before you install
          </h2>
          <p className="mt-6 text-base leading-7 text-muted-foreground">
            All skill source code is available at{" "}
            <a
              href="https://github.com/fraserstanley/zora-agent-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-[#3FFF00] transition-colors"
            >
              github.com/fraserstanley/zora-agent-skills
            </a>
            . Review before installing.
          </p>
        </div>
      </section>
    </div>
  );
}
