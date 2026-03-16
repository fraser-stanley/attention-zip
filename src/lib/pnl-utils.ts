export function pnlColor(value: number) {
  return value >= 0 ? "text-[#3FFF00]" : "text-[#FF00F0]";
}

export function formatPnl(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}
