export default function PageHeader({ title, subtitle, onBack }) {
  return (
    <div
      className="rounded-xl border flex items-center gap-3 px-4 py-4 mb-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <BackButton onClick={onBack} />
      <div className="min-w-0 flex-1">
        <h1
          className="text-lg sm:text-xl font-semibold truncate"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function BackButton({ onClick, label = 'Orqaga' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)';
      }}
    >
      {label}
    </button>
  );
}
