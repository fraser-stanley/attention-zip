const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function isWalletAddress(value: string | null | undefined): value is string {
  return typeof value === "string" && ADDRESS_PATTERN.test(value.trim());
}

export function normalizeWalletAddress(value: string | null | undefined): string | null {
  if (!isWalletAddress(value)) return null;
  return value.trim();
}
