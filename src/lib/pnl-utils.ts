const CURRENCY_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function formatPnl(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, CURRENCY_FORMAT)}`;
}

export function formatPct(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${Math.abs(value).toFixed(1)}%`;
}
