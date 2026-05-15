export function Tag({ children, variant = 'muted', className = '' }) {
  const styleByVariant = {
    primary: {
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
      borderColor: 'var(--accent-border)',
    },
    secondary: {
      background: 'var(--surface-subtle)',
      color: 'var(--text)',
      borderColor: 'var(--border)',
    },
    success: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      borderColor: 'var(--success-border)',
    },
    warning: {
      background: 'var(--warning-bg)',
      color: 'var(--warning)',
      borderColor: 'var(--warning-border)',
    },
    danger: {
      background: 'var(--error-bg)',
      color: 'var(--error)',
      borderColor: 'var(--error-border)',
    },
    muted: {
      background: 'var(--surface-subtle)',
      color: 'var(--text-muted)',
      borderColor: 'var(--border)',
    },
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
      style={styleByVariant[variant] || styleByVariant.muted}
    >
      {children}
    </span>
  );
}
