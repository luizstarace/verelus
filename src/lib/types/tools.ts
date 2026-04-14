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
