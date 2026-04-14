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

export type StageItemType =
  | 'vocal_mic'
  | 'instrument_mic'
  | 'drum_kit'
  | 'guitar_amp'
  | 'bass_amp'
  | 'monitor'
  | 'di_box'
  | 'keyboard'
  | 'guitar_stand'
  | 'bass_stand'
  | 'acoustic_guitar'
  | 'power_outlet'
  | 'custom_label';

export const STAGE_ITEM_META: Record<StageItemType, { label: string; short: string }> = {
  vocal_mic: { label: 'Microfone (vocal)', short: 'Mic' },
  instrument_mic: { label: 'Microfone (instrumento)', short: 'Mic inst' },
  drum_kit: { label: 'Bateria', short: 'Bateria' },
  guitar_amp: { label: 'Amplificador de guitarra', short: 'Amp guit' },
  bass_amp: { label: 'Amplificador de baixo', short: 'Amp baixo' },
  monitor: { label: 'Monitor de chao (spot)', short: 'Spot' },
  di_box: { label: 'DI box', short: 'DI' },
  keyboard: { label: 'Teclado', short: 'Teclado' },
  guitar_stand: { label: 'Guitarra (suporte)', short: 'Guitarra' },
  bass_stand: { label: 'Baixo (suporte)', short: 'Baixo' },
  acoustic_guitar: { label: 'Violao (suporte)', short: 'Violao' },
  power_outlet: { label: 'Tomada 110v/220v', short: 'Tomada' },
  custom_label: { label: 'Rotulo custom', short: 'Custom' },
};

export interface StageItem {
  id: string;
  type: StageItemType;
  x: number;      // 0-1 (0=esquerda, 1=direita)
  y: number;      // 0-1 (0=frente/publico, 1=fundo)
  label?: string; // override do label curto
}

export interface RiderInput {
  artist_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage_template: StageTemplate;
  musicians: MusicianSpec[];
  stage_items?: StageItem[];   // layout visual do palco
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

// ===================== CONTRATO DE SHOW =====================

export interface ContractParty {
  type: 'pf' | 'pj';          // pessoa fisica ou juridica
  name: string;               // nome ou razao social
  document: string;           // CPF ou CNPJ
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  representative?: string;    // se PJ, nome do representante
  representative_document?: string; // CPF do representante
}

export interface ContractInput {
  contractor: ContractParty;  // CONTRATANTE (quem contrata / casa de show)
  artist: ContractParty;      // CONTRATADO (artista/banda)

  // Detalhes do show
  show_date: string;          // ISO YYYY-MM-DD
  show_time: string;          // HH:MM
  show_duration_min: number;  // 30/45/60/90/120 etc
  venue_name: string;         // nome do local
  venue_address: string;      // endereco completo do show
  event_type: string;         // ex: "show privado", "festival", "show em bar", free text
  has_opening_act: boolean;
  opening_act_name?: string;

  // Cache e pagamento
  cache_total: number;        // em centavos para precisao
  payment_method: 'pix' | 'transfer' | 'cash' | 'boleto';
  deposit_percent: number;    // % do sinal (ex: 50 = 50%)
  deposit_due_date?: string;  // ISO data; opcional
  balance_due_timing: 'before_show' | 'on_show_day' | 'after_show';

  // Responsabilidades do CONTRATANTE
  provides_accommodation: boolean;
  provides_transport: boolean;
  provides_meals: boolean;
  provides_equipment: boolean;      // equipamento tecnico conforme rider
  provides_security: boolean;
  provides_promotion: boolean;

  // Cancelamento
  cancel_fee_less_7_days: number;   // % multa se cancelar <7 dias
  cancel_fee_7_to_30_days: number;  // 7-30 dias
  cancel_fee_more_30_days: number;  // >30 dias

  // Direitos de imagem e gravacao
  recording_allowed: 'prohibited' | 'personal_only' | 'promo_with_credit' | 'full_rights';
  streaming_allowed: boolean;
  image_rights_for_promo: boolean;

  // Exclusividade
  has_exclusivity: boolean;
  exclusivity_radius_km?: number;
  exclusivity_days_before?: number;

  // Juridico
  forum_city: string;
  forum_state: string;

  // Observacoes extras
  extra_clauses?: string;
}

export interface ContractOutput {
  pdf_base64: string;
  share_id: string;
}

// ===================== CACHE CALCULATOR =====================

export type ArtistStage = 'seed' | 'emerging' | 'growing' | 'established' | 'reference';
export type VenueType =
  | 'bar_small'
  | 'bar_medium'
  | 'club_small'
  | 'club_medium'
  | 'club_large'
  | 'theater_small'
  | 'theater_large'
  | 'festival_small'
  | 'festival_large'
  | 'corporate'
  | 'private';

export type CityTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export const STAGE_META: Record<ArtistStage, { label: string; listeners_desc: string }> = {
  seed: { label: 'Inicial', listeners_desc: '<500 ouvintes mensais' },
  emerging: { label: 'Emergente', listeners_desc: '500 a 5k' },
  growing: { label: 'Consolidado', listeners_desc: '5k a 50k' },
  established: { label: 'Estabelecido', listeners_desc: '50k a 500k' },
  reference: { label: 'Referencia', listeners_desc: '500k+' },
};

export const VENUE_META: Record<VenueType, { label: string; capacity: string }> = {
  bar_small: { label: 'Bar pequeno', capacity: '50-100 pessoas' },
  bar_medium: { label: 'Bar/pub medio', capacity: '100-300 pessoas' },
  club_small: { label: 'Casa de show pequena', capacity: '200-500 pessoas' },
  club_medium: { label: 'Casa de show media', capacity: '500-1000 pessoas' },
  club_large: { label: 'Casa de show grande', capacity: '1000-2000 pessoas' },
  theater_small: { label: 'Teatro pequeno', capacity: 'ate 500 lugares' },
  theater_large: { label: 'Teatro grande', capacity: '500+ lugares' },
  festival_small: { label: 'Festival pequeno/local', capacity: 'ate 2000 pessoas' },
  festival_large: { label: 'Festival grande', capacity: '2000+ pessoas' },
  corporate: { label: 'Evento corporativo', capacity: 'variado' },
  private: { label: 'Festa privada/casamento', capacity: 'variado' },
};

export const CITY_TIER_META: Record<CityTier, { label: string; example: string; multiplier: number }> = {
  tier1: { label: 'Sao Paulo / Rio de Janeiro', example: 'SP, RJ', multiplier: 1.0 },
  tier2: { label: 'Capital grande', example: 'BH, BSB, POA, Salvador, Recife, Fortaleza, Curitiba', multiplier: 0.85 },
  tier3: { label: 'Outras capitais', example: 'Goiania, Belem, Natal, Joao Pessoa, etc.', multiplier: 0.75 },
  tier4: { label: 'Cidade media/interior', example: 'Cidades menores', multiplier: 0.65 },
};

export interface CacheExpenses {
  transport: number;          // ida e volta, em reais
  accommodation: number;      // hospedagem
  meals: number;              // alimentacao
  hired_musicians: number;    // cache pros musicos contratados
  equipment: number;          // equipamento extra
  tech_crew: number;          // tecnico de som, roadie
  commission: number;         // empresario/booking (geralmente 15-20%)
  other: number;              // outros
}

export interface CacheInput {
  // Perfil do artista
  stage: ArtistStage;
  monthly_listeners?: number;  // se conhecido
  // Show
  venue_type: VenueType;
  show_city_tier: CityTier;
  musicians_traveling: number;
  // Despesas (em reais)
  expenses: CacheExpenses;
}

export interface CacheResult {
  suggested_min: number;        // cache minimo sugerido
  suggested_median: number;     // cache mediano
  suggested_max: number;        // cache maximo
  total_expenses: number;       // soma das despesas
  break_even: number;           // cache minimo pra nao dar prejuizo (= despesas)
  profit_at_median: number;     // lucro se cobrar o median
  margin_percent_at_median: number; // margem percentual
  expense_breakdown: Array<{ label: string; value: number; percent: number }>;
  alerts: string[];             // alertas inteligentes (prejuizo, cache baixo, etc.)
  suggestions: string[];        // sugestoes de como negociar
}

// ===================== PITCH KIT =====================

export type PitchRecipientType =
  | 'playlist_curator_indie'
  | 'playlist_curator_mainstream'
  | 'music_blog'
  | 'radio_station'
  | 'booker_small_venue'
  | 'booker_festival'
  | 'small_label'
  | 'major_label'
  | 'music_journalist'
  | 'tastemaker_influencer';

export const PITCH_RECIPIENT_META: Record<PitchRecipientType, { label: string; description: string }> = {
  playlist_curator_indie: {
    label: 'Curador de playlist indie',
    description: 'Playlists menores, nicho, pessoal',
  },
  playlist_curator_mainstream: {
    label: 'Curador de playlist mainstream',
    description: 'Playlists grandes (50k+ followers)',
  },
  music_blog: {
    label: 'Blog de musica',
    description: 'Portal/blog editorial',
  },
  radio_station: {
    label: 'Radio',
    description: 'AM/FM, web radio, podcast musical',
  },
  booker_small_venue: {
    label: 'Booker de casa de show',
    description: 'Quem agenda shows em clubes e bares',
  },
  booker_festival: {
    label: 'Booker de festival',
    description: 'Curadoria de festival',
  },
  small_label: {
    label: 'Selo independente',
    description: 'Selo pequeno/nicho',
  },
  major_label: {
    label: 'Gravadora/selo grande',
    description: 'Major ou selo nacional',
  },
  music_journalist: {
    label: 'Jornalista de musica',
    description: 'Profissional de midia musical',
  },
  tastemaker_influencer: {
    label: 'Influencer/tastemaker',
    description: 'Perfil musical no Instagram/TikTok',
  },
};

export type PitchTone = 'professional' | 'casual' | 'bold';
export type PitchLanguage = 'pt' | 'en';

export interface PitchInput {
  // Sobre voce e a musica
  artist_name: string;
  song_spotify_url?: string;     // opcional — se informado, enriquece pitch
  song_title: string;
  genre_primary: string;
  mood_keywords: string;         // ex: "melancolica, urgente, cinematica"
  release_type: 'single' | 'ep' | 'album';
  release_date?: string;         // ISO — 'unreleased' se ainda nao lancou

  // Sobre conquistas (pra credibilidade)
  achievements: string;          // 2-3 conquistas recentes em free text
  similar_artists: string;       // 2-3 artistas similares pra dar referencia

  // Destinatario
  recipient_type: PitchRecipientType;
  recipient_name: string;        // ex: "Ana Silva"
  recipient_entity: string;      // ex: "Playlist Indie BR / Blog Tenho Mais Discos"

  // Estilo
  tone: PitchTone;
  language: PitchLanguage;
}

export interface PitchOutput {
  email_subject: string;
  email_body: string;
  one_pager: {
    short_bio: string;           // ate 500 chars
    highlights: string[];        // 3-4 bullets
    hook_line: string;           // 1 frase marcante
  };
  press_release: string;         // texto completo
}

// ===================== QUANDO LANCAR =====================

export type ReleaseType = 'single' | 'ep' | 'album';

export interface ReleaseTimingInput {
  release_type: ReleaseType;
  window_days: 30 | 60 | 90;      // janela de sugestao
  months_to_avoid: number[];       // 0=jan, 11=dez. Opcional.
  artist_name: string;
  genre: string;
  has_growth_data: boolean;        // se tem dados historicos do Growth Tracker
  main_market: 'br' | 'latam' | 'international';
  goal: 'discovery' | 'grow_base' | 'monetize' | 'playlist_placement' | 'press';
}

export interface SuggestedDate {
  iso_date: string;          // YYYY-MM-DD
  day_of_week: string;       // "sexta-feira"
  score: number;             // 0-100
  reasons: string[];         // ate 3 razoes concretas
  warnings: string[];        // potenciais problemas
  context: string;           // "o que vai estar acontecendo no mundo"
}

export interface ReleaseTimingOutput {
  suggestions: SuggestedDate[];      // top 3
  calendar_candidates: Array<{       // todas as sextas da janela, pontuadas
    iso_date: string;
    score: number;
    color: 'green' | 'yellow' | 'red';
  }>;
  strategy_summary: string;           // paragrafo geral
}
