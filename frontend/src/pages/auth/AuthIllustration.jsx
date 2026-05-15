// Sign Up va Login uchun minimal abstrakt illyustratsiya — Kasbim dark theme
export default function AuthIllustration() {
  return (
    <div className="flex justify-center my-3">
      <svg
        width="180"
        height="120"
        viewBox="0 0 180 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow */}
        <ellipse cx="90" cy="60" rx="80" ry="50" fill="url(#glow)" opacity="0.4" />

        {/* Floating particles */}
        <circle cx="22" cy="30" r="3" fill="#60A5FA" opacity="0.4" />
        <circle cx="158" cy="22" r="2.5" fill="#60A5FA" opacity="0.6" />
        <circle cx="160" cy="95" r="4" fill="#60A5FA" opacity="0.3" />
        <circle cx="14" cy="85" r="2.5" fill="#60A5FA" opacity="0.5" />
        <circle cx="40" cy="15" r="2" fill="#93C5FD" opacity="0.5" />
        <circle cx="140" cy="60" r="2" fill="#93C5FD" opacity="0.5" />

        {/* Network lines */}
        <line
          x1="22"
          y1="30"
          x2="90"
          y2="55"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="158"
          y1="22"
          x2="90"
          y2="55"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="14"
          y1="85"
          x2="90"
          y2="55"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="160"
          y1="95"
          x2="90"
          y2="55"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Central node — Kasbim compass */}
        <circle cx="90" cy="55" r="22" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
        <circle cx="90" cy="55" r="14" fill="url(#core)" />

        {/* Compass needle */}
        <path
          d="M90 44 L94 55 L90 66 L86 55 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <circle cx="90" cy="55" r="2" fill="#FFFFFF" />

        <defs>
          <radialGradient id="glow" cx="0.5" cy="0.5">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="core" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
