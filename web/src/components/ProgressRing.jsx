function ProgressRing({ value = 0, label = "Progress" }) {
  const normalized = Math.max(0, Math.min(100, value));
  const degrees = Math.round((normalized / 100) * 360);

  return (
    <div
      className="ring"
      style={{
        background: `conic-gradient(var(--accent-strong) ${degrees}deg, var(--ring-bg) ${degrees}deg)`
      }}
      role="img"
      aria-label={`${label}: ${normalized}%`}
    >
      <div className="ring-center">
        <span className="ring-value">{normalized}%</span>
        <span className="ring-label">{label}</span>
      </div>
    </div>
  );
}

export default ProgressRing;
