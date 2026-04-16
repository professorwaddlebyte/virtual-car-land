function ScoreBar({ value, max = 100, color }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: color || "#1A9988",
        }}
      />
    </div>
  );
}

export default ScoreBar;



