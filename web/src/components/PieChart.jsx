function PieChart({ done = 0, total = 0, label = "Complete", size = 180 }) {
  const safeTotal = Math.max(total, 0);
  const safeDone = Math.min(Math.max(done, 0), safeTotal);
  const pct = safeTotal > 0 ? safeDone / safeTotal : 0;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Build pie slice path (done arc) from 12 o'clock clockwise
  const angle = pct * Math.PI * 2;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;
  const isFull = pct >= 1;

  const donePath = isFull
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
    : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;

  const percentLabel = Math.round(pct * 100);
  const remaining = Math.max(0, safeTotal - safeDone);

  return (
    <div className="pie-wrap" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-svg">
        <defs>
          <linearGradient id="pieDone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} className="pie-track" />
        {safeDone > 0 && (
          <path d={donePath} fill="url(#pieDone)" className="pie-slice" />
        )}
        <circle cx={cx} cy={cy} r={r * 0.42} className="pie-hole" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="pie-pct">{percentLabel}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="pie-sub">{label}</text>
      </svg>
      <div className="pie-legend">
        <span><i className="bullet done" /> {safeDone} done</span>
        <span><i className="bullet pending" /> {remaining} left</span>
      </div>
    </div>
  );
}

export default PieChart;
