/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Kasbim Design System — Dark Tech Blue
        brand: {
          50:  'rgba(59,130,246,0.08)',
          100: 'rgba(59,130,246,0.12)',
          200: 'rgba(59,130,246,0.18)',
          400: '#93C5FD',
          500: '#60A5FA',
          600: '#3B82F6',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E3A8A',
        },
        surface: {
          DEFAULT: '#1E293B',
          muted:   '#0F172A',
          subtle:  '#334155',
        },
        ink: {
          DEFAULT: '#F1F5F9',
          muted:   '#94A3B8',
          faint:   '#64748B',
        },
        line: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        soft:    '0 4px 24px rgba(0,0,0,0.5)',
        glow:    '0 0 24px rgba(59,130,246,0.35)',
        glowSm:  '0 0 12px rgba(59,130,246,0.25)',
        focus:   '0 0 0 3px rgba(59,130,246,0.15)',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
