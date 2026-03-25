const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export type WalletSession = {
  address: string;
  source: "zora-cli";
  connectedAt: string;
};

export function isWalletSession(value: unknown): value is WalletSession {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<WalletSession>;
  return (
    typeof candidate.address === "string" &&
    ADDRESS_PATTERN.test(candidate.address) &&
    candidate.source === "zora-cli" &&
    typeof candidate.connectedAt === "string" &&
    Number.isFinite(Date.parse(candidate.connectedAt))
  );
}
