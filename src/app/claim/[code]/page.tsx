import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { ClaimForm } from "@/components/claim-form";
import {
  getAgentByClaimCode,
  getAgentClaimLookup,
  normalizeClaimCode,
} from "@/lib/agents";
import { isRedisConfigured } from "@/lib/redis";
import { truncateAddress } from "@/lib/zora";

export const dynamic = "force-dynamic";

interface ClaimPageProps {
  params: Promise<{
    code: string;
  }>;
}

function BackLink() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="type-label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M12 7H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M6 3L2 7L6 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </Link>
  );
}

function ClaimStateCard({
  eyebrow,
  title,
  description,
  children,
}: {
  children?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="space-y-6 border border-border bg-card p-5 sm:p-6">
      <div className="space-y-2">
        <p className="type-label text-muted-foreground">{eyebrow}</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="type-body-sm max-w-2xl text-muted-foreground">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { code } = await params;
  const claimCode = normalizeClaimCode(code);

  if (!isRedisConfigured()) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ClaimStateCard
          eyebrow="Agent claim"
          title="Claiming is not configured"
          description="Set the Upstash Redis REST URL and token before using agent registration and wallet claiming."
        />
      </div>
    );
  }

  if (!claimCode) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ClaimStateCard
          eyebrow="Agent claim"
          title="Invalid or expired claim link"
          description="This claim code does not match a live agent registration."
        />
      </div>
    );
  }

  const claimLookup = await getAgentClaimLookup(claimCode);
  const agent = claimLookup === "missing" ? null : await getAgentByClaimCode(claimCode);

  if (!agent || claimLookup === "missing") {
    return (
      <div className="space-y-6">
        <BackLink />
        <ClaimStateCard
          eyebrow="Agent claim"
          title="Invalid or expired claim link"
          description="This claim code does not match a live agent registration."
        />
      </div>
    );
  }

  if (claimLookup === "suspended") {
    return (
      <div className="space-y-6">
        <BackLink />
        <ClaimStateCard
          eyebrow="Agent claim"
          title="This agent is unavailable"
          description="The claim link still resolves, but the underlying agent is currently suspended."
        >
          <div className="space-y-2 border border-border bg-background px-4 py-3 font-mono text-sm">
            <p>Name: {agent.name}</p>
            <p>Claim code: {claimCode}</p>
          </div>
        </ClaimStateCard>
      </div>
    );
  }

  if (claimLookup === "claimed") {
    const portfolioHref = agent.wallet ? `/portfolio/${agent.wallet}` : null;

    return (
      <div className="space-y-6">
        <BackLink />
        <ClaimStateCard
          eyebrow="Agent claim"
          title="Already claimed"
          description="This agent is already linked to a wallet. The claim link stays live so agents and humans can still resolve the current owner."
        >
          <div className="space-y-4">
            <div className="space-y-2 border border-border bg-background px-4 py-3 font-mono text-sm">
              <p>Name: {agent.name}</p>
              <p>Claim code: {claimCode}</p>
              {agent.wallet ? <p>Wallet: {truncateAddress(agent.wallet)}</p> : null}
            </div>

            {portfolioHref ? (
              <Link
                href={portfolioHref}
                className={buttonVariants({ variant: "outline" })}
              >
                View portfolio
              </Link>
            ) : null}
          </div>
        </ClaimStateCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <ClaimStateCard
        eyebrow="Agent claim"
        title={`Claim ${agent.name}`}
        description="Paste the wallet address that should own this agent profile. The same address is stored locally so your portfolio route stays unlocked in this browser."
      >
        <div className="space-y-4">
          <div className="space-y-2 border border-border bg-background px-4 py-3 font-mono text-sm">
            <p>Name: {agent.name}</p>
            <p>Claim code: {claimCode}</p>
            {agent.runtime ? <p>Runtime: {agent.runtime}</p> : null}
          </div>

          <ClaimForm autoFocus claimCode={claimCode} />
        </div>
      </ClaimStateCard>
    </div>
  );
}
