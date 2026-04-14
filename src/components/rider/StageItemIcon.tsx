import type { StageItemType } from '@/lib/types/tools';

/**
 * Icones SVG dos equipamentos de palco.
 * Cada icone e desenhado num viewbox 40x40, simples e reconhecivel.
 */

interface IconProps {
  type: StageItemType;
  size?: number;
  color?: string;
}

export function StageItemIcon({ type, size = 40, color = 'currentColor' }: IconProps) {
  const s = size;
  const c = color;

  switch (type) {
    case 'vocal_mic':
    case 'instrument_mic':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* mic head */}
          <circle cx="20" cy="8" r="5" fill={c} />
          {/* handle */}
          <rect x="18.5" y="13" width="3" height="4" fill={c} />
          {/* stand vertical */}
          <line x1="20" y1="17" x2="20" y2="33" stroke={c} strokeWidth="1.8" />
          {/* base */}
          <ellipse cx="20" cy="34" rx="8" ry="2" fill={c} />
        </svg>
      );

    case 'drum_kit':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* bass drum (front, center) */}
          <circle cx="20" cy="26" r="11" fill="none" stroke={c} strokeWidth="1.5" />
          <circle cx="20" cy="26" r="7" fill={c} opacity="0.15" />
          {/* snare */}
          <circle cx="12" cy="20" r="4" fill="none" stroke={c} strokeWidth="1.3" />
          {/* tom */}
          <circle cx="28" cy="16" r="3" fill="none" stroke={c} strokeWidth="1.3" />
          {/* floor tom */}
          <circle cx="32" cy="27" r="4" fill="none" stroke={c} strokeWidth="1.3" />
          {/* cymbal left */}
          <line x1="5" y1="12" x2="11" y2="9" stroke={c} strokeWidth="1.3" />
          <ellipse cx="8" cy="10" rx="4" ry="1" fill={c} />
          {/* cymbal right */}
          <line x1="35" y1="8" x2="30" y2="11" stroke={c} strokeWidth="1.3" />
          <ellipse cx="33" cy="9" rx="4" ry="1" fill={c} />
        </svg>
      );

    case 'guitar_amp':
    case 'bass_amp':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* box */}
          <rect x="6" y="10" width="28" height="22" fill="none" stroke={c} strokeWidth="1.5" rx="2" />
          {/* speaker grille lines */}
          <line x1="10" y1="15" x2="30" y2="15" stroke={c} strokeWidth="0.8" />
          <line x1="10" y1="20" x2="30" y2="20" stroke={c} strokeWidth="0.8" />
          <line x1="10" y1="25" x2="30" y2="25" stroke={c} strokeWidth="0.8" />
          {/* knobs */}
          <circle cx="12" cy="11" r="0.8" fill={c} />
          <circle cx="16" cy="11" r="0.8" fill={c} />
          <circle cx="20" cy="11" r="0.8" fill={c} />
          {/* bass amp has second cabinet visual */}
          {type === 'bass_amp' && (
            <rect x="8" y="32" width="24" height="4" fill={c} opacity="0.2" />
          )}
        </svg>
      );

    case 'monitor':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* wedge trapezoid */}
          <polygon points="6,28 34,28 30,18 10,18" fill="none" stroke={c} strokeWidth="1.5" />
          {/* speaker circle */}
          <circle cx="20" cy="23" r="3" fill={c} opacity="0.3" />
          <circle cx="20" cy="23" r="3" fill="none" stroke={c} strokeWidth="1" />
        </svg>
      );

    case 'di_box':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <rect x="12" y="14" width="16" height="12" fill="none" stroke={c} strokeWidth="1.5" rx="1" />
          <text x="20" y="22" fontSize="5" fontWeight="bold" fill={c} textAnchor="middle">DI</text>
          {/* xlr output */}
          <circle cx="20" cy="27" r="1.2" fill={c} />
        </svg>
      );

    case 'keyboard':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* keyboard body */}
          <rect x="3" y="16" width="34" height="8" fill="none" stroke={c} strokeWidth="1.3" rx="0.5" />
          {/* black keys */}
          <rect x="8" y="16" width="1.5" height="5" fill={c} />
          <rect x="12" y="16" width="1.5" height="5" fill={c} />
          <rect x="18" y="16" width="1.5" height="5" fill={c} />
          <rect x="22" y="16" width="1.5" height="5" fill={c} />
          <rect x="26" y="16" width="1.5" height="5" fill={c} />
          <rect x="30" y="16" width="1.5" height="5" fill={c} />
          {/* stand */}
          <line x1="8" y1="24" x2="6" y2="32" stroke={c} strokeWidth="1.2" />
          <line x1="32" y1="24" x2="34" y2="32" stroke={c} strokeWidth="1.2" />
        </svg>
      );

    case 'guitar_stand':
    case 'bass_stand':
    case 'acoustic_guitar':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          {/* body */}
          {type === 'acoustic_guitar' ? (
            <ellipse cx="20" cy="26" rx="8" ry="7" fill="none" stroke={c} strokeWidth="1.5" />
          ) : (
            <path
              d="M12 22 Q12 18 16 18 L24 18 Q28 18 28 22 L28 30 Q28 34 20 34 Q12 34 12 30 Z"
              fill="none"
              stroke={c}
              strokeWidth="1.5"
            />
          )}
          {/* sound hole / pickup */}
          <circle cx="20" cy="25" r="1.8" fill={c} />
          {/* neck */}
          <rect x="19" y="6" width="2" height="14" fill={c} />
          {/* headstock */}
          <rect x="17" y="4" width="6" height="3" fill={c} />
        </svg>
      );

    case 'power_outlet':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="10" fill="none" stroke={c} strokeWidth="1.5" />
          <circle cx="17" cy="18" r="1.2" fill={c} />
          <circle cx="23" cy="18" r="1.2" fill={c} />
          <rect x="18.5" y="22" width="3" height="1.5" fill={c} />
        </svg>
      );

    case 'custom_label':
      return (
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
          <rect x="6" y="14" width="28" height="12" fill="none" stroke={c} strokeWidth="1.3" rx="2" strokeDasharray="2 2" />
          <line x1="12" y1="20" x2="28" y2="20" stroke={c} strokeWidth="1" />
        </svg>
      );
  }
}
