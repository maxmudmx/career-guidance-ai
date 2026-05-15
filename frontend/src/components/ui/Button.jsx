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
    'rounded-full font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 border whitespace-nowrap';

  const variants = {
    primary:
      'bg-[#3B82F6] text-white border-[#3B82F6] hover:bg-[#60A5FA] hover:shadow-[0_0_20px_rgba(59,130,246,0.45)]',
    secondary:
      'bg-[rgba(59,130,246,0.12)] text-[#60A5FA] border-[rgba(59,130,246,0.3)] hover:bg-[rgba(59,130,246,0.2)]',
    ghost:
      'bg-transparent text-[#94A3B8] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F1F5F9]',
    danger:
      'bg-[#EF4444] text-white border-[#EF4444] hover:bg-[#DC2626]',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
