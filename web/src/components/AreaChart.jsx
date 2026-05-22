function AreaChart({ data = [], height = 180 }) {
  const width = 600;
  const padding = { top: 14, right: 12, bottom: 22, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = 100;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((v, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (Math.min(max, v) / max) * innerH;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${padding.top + innerH} L ${points[0][0].toFixed(1)} ${padding.top + innerH} Z`
    : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="area-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="areaStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((g) => {
        const y = padding.top + innerH - (g / 100) * innerH;
        return (
          <g key={g}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
            <text x={4} y={y + 4} fill="rgba(255,255,255,0.45)" fontSize="9">
              {g}
            </text>
          </g>
        );
      })}

      {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
      {linePath && <path d={linePath} fill="none" stroke="url(#areaStroke)" strokeWidth="2.4" />}

      {points.map(([x, y], i) =>
        i % 3 === 0 ? <circle key={i} cx={x} cy={y} r="2.4" fill="#a78bfa" /> : null
      )}

      {data.map((_, i) =>
        i % 3 === 0 ? (
          <text
            key={`x-${i}`}
            x={padding.left + i * stepX}
            y={height - 6}
            fill="rgba(255,255,255,0.45)"
            fontSize="9"
            textAnchor="middle"
          >
            {i + 1}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default AreaChart;
