interface Props {
  tool: string;
  size?: number;
  className?: string;
}

/**
 * Icones SVG simples para cada ferramenta no dashboard.
 * Stroke currentColor pra herdar cor do contexto.
 */
export function ToolIcon({ tool, size = 24, className }: Props) {
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (tool) {
    case 'bio':
      // Document with lines
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
          <line x1="8" y1="9" x2="10" y2="9" />
        </svg>
      );
    case 'cache':
      // Calculator / money
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="12" x2="10" y2="12" />
          <line x1="12" y1="12" x2="14" y2="12" />
          <line x1="16" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="10" y2="16" />
          <line x1="12" y1="16" x2="14" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      );
    case 'rider':
      // Stage / speakers
      return (
        <svg {...common}>
          <rect x="3" y="14" width="5" height="7" rx="0.5" />
          <rect x="16" y="14" width="5" height="7" rx="0.5" />
          <line x1="3" y1="11" x2="21" y2="11" />
          <circle cx="12" cy="7" r="2" />
          <line x1="12" y1="9" x2="12" y2="11" />
        </svg>
      );
    case 'contract':
      // Document with signature line
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="12" x2="14" y2="12" />
          <line x1="8" y1="16" x2="16" y2="16" />
          <path d="M9 19 q1.5 -1 3 0 t3 0" />
        </svg>
      );
    case 'pitch-kit':
      // Mail / envelope with star
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <polyline points="3,7 12,13 21,7" />
        </svg>
      );
    case 'release-timing':
      // Calendar with star
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
          <circle cx="12" cy="15" r="2" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'launch-checklist':
      // Checkmark list
      return (
        <svg {...common}>
          <path d="M4 6l2 2 4-4" />
          <line x1="14" y1="6" x2="21" y2="6" />
          <path d="M4 13l2 2 4-4" />
          <line x1="14" y1="13" x2="21" y2="13" />
          <path d="M4 20l2 2 4-4" strokeOpacity="0.4" />
          <line x1="14" y1="20" x2="21" y2="20" strokeOpacity="0.4" />
        </svg>
      );
    case 'growth':
      // Line chart going up
      return (
        <svg {...common}>
          <polyline points="3,17 8,12 13,15 21,5" />
          <polyline points="16,5 21,5 21,10" />
        </svg>
      );
    case 'competitors':
      // Bars comparison
      return (
        <svg {...common}>
          <rect x="4" y="12" width="4" height="9" />
          <rect x="10" y="7" width="4" height="14" />
          <rect x="16" y="14" width="4" height="7" />
        </svg>
      );
    case 'goals':
      // Target
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'content-calendar':
      // Calendar with content
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <rect x="6" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
          <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
          <rect x="15" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
        </svg>
      );
    default:
      // Default: grid dots
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <circle cx="17" cy="7" r="1.5" fill="currentColor" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="17" cy="12" r="1.5" fill="currentColor" />
          <circle cx="7" cy="17" r="1.5" fill="currentColor" />
          <circle cx="12" cy="17" r="1.5" fill="currentColor" />
          <circle cx="17" cy="17" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}
