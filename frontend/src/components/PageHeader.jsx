import { ArrowLeft } from 'lucide-react';

/**
 * Sticky page header — boxed icon-only back button + title + optional decorative icon.
 *
 * Props:
 * - title:    page title (string, required)
 * - subtitle: optional subtitle below title
 * - onBack:   click handler for back button
 * - icon:     optional decorative Lucide icon component (rendered next to title in soft box)
 */
export default function PageHeader({ title, subtitle, onBack, icon: Icon }) {
  return (
    <div
      className="rounded-xl border flex items-center gap-3 px-4 py-4 mb-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <BackButton onClick={onBack} />

      {Icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h1
          className="text-lg sm:text-xl font-semibold truncate"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs sm:text-sm truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Boxed icon-only back button — used by PageHeader, but also exported for stand-alone use.
 */
export function BackButton({ onClick, label = 'Orqaga' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors flex-shrink-0"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
