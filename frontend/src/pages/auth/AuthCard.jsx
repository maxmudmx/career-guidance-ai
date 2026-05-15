import { ChevronLeft } from 'lucide-react';
import AuthIllustration from './AuthIllustration';

/**
 * Sign Up / Log In sahifalari uchun umumiy card layout — Kasbim Dark Theme.
 */
export default function AuthCard({ title, onBack, children, footer }) {
  return (
    <div
      className="w-full max-w-[420px] rounded-2xl overflow-hidden relative"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-elevated, 0 4px 32px rgba(0,0,0,0.5))',
      }}
    >
      {/* Header — gradient blue */}
      <div
        className="px-6 py-5 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
        }}
      >
        {/* Subtle glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            background:
              'radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)',
          }}
        />
        <button
          type="button"
          onClick={onBack}
          aria-label="Orqaga"
          className="text-white/90 hover:text-white transition p-1 -ml-1 relative z-10"
        >
          <ChevronLeft size={22} />
        </button>
        <h1
          className="text-white text-2xl font-bold tracking-tight relative z-10"
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
      </div>

      {/* Body */}
      <div className="px-7 pt-5 pb-6">
        <AuthIllustration />
        <div className="mt-3">{children}</div>
        {footer && (
          <div
            className="mt-5 text-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
