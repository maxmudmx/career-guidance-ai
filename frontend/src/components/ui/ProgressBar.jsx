export function ProgressBar({ current, total, showLabel = true, className = '' }) {
  const safeTotal = total > 0 ? total : 1;
  const percentage = Math.min(100, Math.max(0, (current / safeTotal) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#94A3B8] font-mono">
            {current} / {total}
          </span>
          <span className="text-xs text-[#60A5FA] font-mono font-semibold">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #1D4ED8, #60A5FA)',
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}
        />
      </div>
    </div>
  );
}
