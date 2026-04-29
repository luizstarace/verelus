interface Props {
  size?: number;
  showName?: boolean;
  className?: string;
  withRadar?: boolean;
}

// Watchtower / lighthouse mark for Atalaia. The eye on the platform is the
// surveillance motif — radar rings ping above the antenna when withRadar=true.
export default function AtalaiaLogo({ size = 56, showName = false, className = '', withRadar = true }: Props) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {withRadar && (
          <>
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-cta animate-radar-ping pointer-events-none"
              aria-hidden
            />
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-cta animate-radar-ping-delayed pointer-events-none"
              aria-hidden
            />
          </>
        )}
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Antenna */}
          <line x1="32" y1="2" x2="32" y2="10" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
          {/* Beacon */}
          <circle cx="32" cy="2" r="2.2" fill="#f59e0b" />
          {/* Roof (cone) */}
          <path d="M22 18 L42 18 L32 8 Z" fill="#1e3a5f" />
          {/* Watch platform */}
          <rect x="20" y="18" width="24" height="4" rx="1" fill="#1e3a5f" />
          {/* Eye on the watch platform */}
          <circle cx="32" cy="20" r="1.4" fill="#f59e0b" />
          {/* Tower body */}
          <rect x="25" y="22" width="14" height="22" fill="#1e3a5f" />
          {/* Tower windows */}
          <rect x="29" y="26" width="6" height="3" fill="#3b82f6" rx="0.5" />
          <rect x="29" y="32" width="6" height="3" fill="#3b82f6" rx="0.5" />
          <rect x="29" y="38" width="6" height="3" fill="#3b82f6" rx="0.5" />
          {/* Base flare */}
          <path d="M19 44 L45 44 L48 56 L16 56 Z" fill="#1e3a5f" />
          {/* Door */}
          <path d="M30 50 L34 50 L34 56 L30 56 Z" fill="#f59e0b" />
          {/* Light beams (subtle) */}
          <path
            d="M32 4 L18 18 L18 14 Z"
            fill="#f59e0b"
            fillOpacity="0.18"
          />
          <path
            d="M32 4 L46 18 L46 14 Z"
            fill="#f59e0b"
            fillOpacity="0.18"
          />
        </svg>
      </div>
      {showName && (
        <div className="leading-tight">
          <p className="font-bold text-brand-text text-lg sm:text-xl">Atalaia</p>
          <p className="text-[10px] sm:text-xs text-brand-muted uppercase tracking-wider">Vigia 24/7</p>
        </div>
      )}
    </div>
  );
}
