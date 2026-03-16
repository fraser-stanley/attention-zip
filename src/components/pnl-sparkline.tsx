import type { SparklinePoint } from "@/lib/agent-mock-data";
import { formatPnl } from "@/lib/pnl-utils";

export function PnlSparkline({
  data,
  width = 320,
  height = 120,
}: {
  data: SparklinePoint[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values
    .map((v, i) => {
      const x = padX + (i / (values.length - 1)) * chartW;
      const y = padY + chartH - ((v - min) / range) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const lastValue = values[values.length - 1];
  const firstValue = values[0];
  const positive = lastValue >= firstValue;
  const strokeColor = positive ? "#3FFF00" : "#FF00F0";

  // Zero line y position
  const zeroY = padY + chartH - ((0 - min) / range) * chartH;

  // Last point position
  const lastX = padX + chartW;
  const lastY = padY + chartH - ((lastValue - min) / range) * chartH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Zero line */}
      {min < 0 && (
        <line
          x1={padX}
          y1={zeroY}
          x2={width - padX}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4 4"
        />
      )}

      {/* Area fill */}
      <polygon
        points={`${padX},${padY + chartH} ${points} ${lastX},${padY + chartH}`}
        fill={strokeColor}
        fillOpacity={0.05}
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* End dot */}
      <circle cx={lastX} cy={lastY} r={2.5} fill={strokeColor} />

      {/* End label */}
      <text
        x={lastX - 4}
        y={lastY - 8}
        textAnchor="end"
        className="fill-foreground"
        fontSize={10}
        fontFamily="monospace"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatPnl(lastValue)}
      </text>
    </svg>
  );
}
