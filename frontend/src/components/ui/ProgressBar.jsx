export function ProgressBar({ current, total, showLabel = true, className = '' }) {
  const safeTotal = total > 0 ? total : 1;
  const percentage = Math.min(100, Math.max(0, (current / safeTotal) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {current} / {total}
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-hover)' }}
      >
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            background: 'var(--text)',
          }}
        />
      </div>
    </div>
  );
}
