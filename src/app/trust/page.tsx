import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TrustPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-4xl tracking-tight">Trust & Safety</h1>
        <p className="text-sm text-muted-foreground">
          What we do, what we don&apos;t, and how to keep your wallet safe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Our model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            We wrote every skill in this repo and published the source. You can
            read the code before you install anything.
          </p>
          <p>
            <strong>
              Execution is local to your agent. We don&apos;t hold keys or submit
              transactions.
            </strong>
          </p>
          <p className="text-muted-foreground">
            Verification means we reviewed the published skill source in this
            repo. It does not mean we control your local runtime.
          </p>
          <p className="text-muted-foreground">
            Any execution-capable modifications you make locally are outside the
            scope of this v0.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet safety presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5 shrink-0">
                Scout
              </Badge>
              <div>
                <p className="text-sm font-medium">Read-only, no funds</p>
                <p className="text-xs text-muted-foreground">
                  For monitoring and alerts only. No wallet needed. All v0 skills
                  work in this mode.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5 shrink-0">
                Trader
              </Badge>
              <div>
                <p className="text-sm font-medium">
                  Bounded funds, execution enabled
                </p>
                <p className="text-xs text-muted-foreground">
                  For future execution-capable skills. Use a dedicated wallet with
                  limited funds. Never your personal wallet.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-0.5 shrink-0">
                Personal
              </Badge>
              <div>
                <p className="text-sm font-medium">Not recommended</p>
                <p className="text-xs text-muted-foreground">
                  Never use your personal wallet with agent skills. Create a
                  dedicated agent wallet with{" "}
                  <code className="bg-muted px-1 rounded">zora setup</code>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What we don&apos;t do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-destructive">x</span>
              Hold or manage private keys
            </li>
            <li className="flex items-center gap-2">
              <span className="text-destructive">x</span>
              Submit transactions on your behalf
            </li>
            <li className="flex items-center gap-2">
              <span className="text-destructive">x</span>
              Enforce execution guardrails server-side
            </li>
            <li className="flex items-center gap-2">
              <span className="text-destructive">x</span>
              Accept third-party skill submissions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-destructive">x</span>
              Guarantee trading outcomes
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source code</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            All skill source code is available at{" "}
            <a
              href="https://github.com/fraserstanley/zora-agent-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              github.com/fraserstanley/zora-agent-skills
            </a>
            . Review before installing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
