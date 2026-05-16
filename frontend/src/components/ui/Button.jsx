export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  onClick,
  ...rest
}) {
  const base =
    'rounded-full font-semibold transition-opacity duration-150 inline-flex items-center justify-center gap-2 border whitespace-nowrap';

  const styleByVariant = {
    primary: {
      background: 'var(--text)',
      color: 'var(--bg)',
      borderColor: 'var(--text)',
    },
    secondary: {
      background: 'var(--bg-hover)',
      color: 'var(--text)',
      borderColor: 'var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      borderColor: 'var(--border)',
    },
    danger: {
      background: 'var(--text)',
      color: 'var(--bg)',
      borderColor: 'var(--text)',
    },
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85';

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${disabledCls} ${className}`}
      style={styleByVariant[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}
