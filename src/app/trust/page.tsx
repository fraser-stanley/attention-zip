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
      <section className="pt-4 pb-20">
        <p className="type-label text-muted-foreground">Trust &amp; Safety</p>
        <h1 className="type-display mt-6 max-w-4xl">
          We publish source.{" "}
          <span className="highlight-block">You control execution.</span>
        </h1>
        <p className="type-body mt-8 max-w-2xl text-muted-foreground">
          How this works and how to keep your wallet safe.
        </p>
      </section>

      {/* Our model */}
      <section className="py-20">
        <div className="max-w-2xl">
          <p className="type-label text-muted-foreground">Our model</p>
          <h2 className="type-title mt-4 max-w-4xl">
            Source-published, locally executed
          </h2>
          <div className="type-body mt-8 space-y-6 text-muted-foreground">
            <p>
              We wrote every skill in this repo and published the source. You can
              read the code before you install anything.
            </p>
            <p className="type-card-title text-foreground">
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
      <section className="py-20">
        <p className="type-label text-muted-foreground">Wallet safety presets</p>
        <h2 className="type-section mt-4 max-w-2xl">
          Never reuse your personal wallet
        </h2>
        <p className="type-body mt-4 max-w-2xl text-muted-foreground">
          Execution skills like Momentum Trader should only run in a dedicated
          wallet with bounded funds. Most other skills are read-only.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="bg-background p-6 sm:p-8">
            <p className="type-label text-muted-foreground">01</p>
            <h3 className="type-card-title mt-3">Scout</h3>
            <p className="type-body-sm mt-1 font-mono text-[#3FFF00]">
              Read-only, no funds
            </p>
            <p className="type-body-sm mt-4 text-muted-foreground">
              Monitoring and alerts only. No wallet needed. Most skills work
              here.
            </p>
          </div>

          <div className="bg-background p-6 sm:p-8">
            <p className="type-label text-muted-foreground">02</p>
            <h3 className="type-card-title mt-3">Trader</h3>
            <p className="type-body-sm mt-1 font-mono text-foreground">
              Dedicated wallet, execution enabled
            </p>
            <p className="type-body-sm mt-4 text-muted-foreground">
              Required for execution skills. Dedicated wallet, limited funds.
              Never your personal wallet.
            </p>
          </div>

          <div className="bg-background p-6 sm:p-8">
            <p className="type-label text-muted-foreground">03</p>
            <h3 className="type-card-title mt-3">Personal</h3>
            <p className="type-body-sm mt-1 font-mono text-destructive">
              Not recommended
            </p>
            <p className="type-body-sm mt-4 text-muted-foreground">
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
      <section className="py-20">
        <p className="type-label text-muted-foreground">Boundaries</p>
        <h2 className="type-section mt-4">
          What we don&apos;t do
        </h2>

        <div className="mt-12 max-w-2xl">
          {boundaries.map((item, i) => (
            <div key={i} className="py-4 flex items-baseline gap-4">
              <span className="type-label w-8 shrink-0 text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="type-body text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Source code */}
      <section className="py-20">
        <div className="max-w-2xl">
          <p className="type-label text-muted-foreground">Source code</p>
          <h2 className="type-section mt-4">
            Read before you install
          </h2>
          <p className="type-body mt-6 text-muted-foreground">
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
