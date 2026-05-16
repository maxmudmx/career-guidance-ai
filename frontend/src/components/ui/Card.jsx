export function Card({ children, className = '', hover = false, onClick, style = {} }) {
  const hoverCls = hover
    ? 'hover:border-[rgba(59,130,246,0.4)] transition-colors duration-150'
    : '';
  const clickCls = onClick ? 'cursor-pointer' : '';
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border ${clickCls} ${hoverCls} ${className}`}
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card, none)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
