/**
 * Tipos compartilhados para as ferramentas da toolbox.
 */

export type Tone = 'formal' | 'casual' | 'poetico' | 'edgy';
export type Language = 'pt' | 'en';

/** Input do formulario guiado da Bio */
export interface BioInput {
  artist_name: string;
  differentiator: string;     // "em 2 frases, o que te diferencia"
  main_achievement: string;   // "conquista mais significativa"
  mood_three_words: string;   // "3 palavras, o mood da sua musica"
  unusual_influence: string;  // "influencia nao-obvia"
  direct_influences: string;  // "2-3 influencias diretas"
  genre?: string;             // opcional, do perfil Spotify
  city?: string;              // opcional
  tone: Tone;
  language: Language;
}

/** Output gerado pela Bio */
export interface BioOutput {
  spotify: string;     // ate 1500 chars
  instagram: string;   // ate 150 chars
  epk: string;         // 500-800 chars
  twitter: string;     // ate 160 chars
}

/** Limits por plataforma */
export const BIO_CHAR_LIMITS = {
  spotify: 1500,
  instagram: 150,
  epk: 800,
  twitter: 160,
} as const;

// ===================== RIDER TECNICO =====================

export type StageTemplate =
  | 'solo_acoustic'
  | 'solo_electric'
  | 'duo'
  | 'power_trio'
  | 'quartet'
  | 'five_piece'
  | 'six_plus'
  | 'dj_setup'
  | 'custom';

export const STAGE_TEMPLATES: Record<StageTemplate, { label: string; description: string; musicians: number }> = {
  solo_acoustic: { label: 'Solo acustico', description: 'Voz + violao/piano', musicians: 1 },
  solo_electric: { label: 'Solo eletrico', description: 'Voz + guitarra/baixo eletrico', musicians: 1 },
  duo: { label: 'Duo', description: '2 musicos', musicians: 2 },
  power_trio: { label: 'Power trio', description: 'Guitarra + baixo + bateria', musicians: 3 },
  quartet: { label: 'Quarteto', description: '4 musicos', musicians: 4 },
  five_piece: { label: 'Quinteto', description: '5 musicos', musicians: 5 },
  six_plus: { label: '6+ musicos', description: 'Banda grande ou orquestracao', musicians: 6 },
  dj_setup: { label: 'DJ setup', description: 'DJ + eventualmente vocal', musicians: 1 },
  custom: { label: 'Outro formato', description: 'Descrever no campo custom', musicians: 1 },
};

export interface MusicianSpec {
  role: string;       // ex: "Vocal principal", "Guitarra base", "Bateria"
  instrument: string; // ex: "SM58", "violao de aco", "bateria 5 pecas"
  needs_mic: boolean;
  needs_monitor: boolean;
  needs_di: boolean;   // Direct Input
  notes?: string;
}

export interface RiderInput {
  artist_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage_template: StageTemplate;
  musicians: MusicianSpec[];
  pa_minimum_watts: number;           // ex: 2000
  lighting: 'basic' | 'scenic' | 'custom';
  lighting_notes?: string;
  soundcheck_minutes: 30 | 60 | 90 | 120;
  dressing_room: boolean;
  meals_needed: boolean;
  meals_count: number;
  accommodation: boolean;
  accommodation_details?: string;
  transport_notes?: string;
  special_technical_notes?: string;
}

export interface RiderOutput {
  pdf_base64: string;    // PDF encoded base64
  share_id: string;      // id unico pra link compartilhavel
}
