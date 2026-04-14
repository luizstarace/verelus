/**
 * Tipos do sistema de Career Intelligence do Verulus.
 * Define estrutura de estagios, dimensoes, survey, e diagnostic.
 */

export type Stage = 'Inicial' | 'Emergente' | 'Consolidado' | 'Estabelecido' | 'Referencia';

export const STAGES: Stage[] = ['Inicial', 'Emergente', 'Consolidado', 'Estabelecido', 'Referencia'];

export type DimensionName =
  | 'audience_size'
  | 'growth_trajectory'
  | 'release_consistency'
  | 'professionalism'
  | 'revenue_business'
  | 'multi_platform_presence';

export interface DimensionScores {
  audience_size: number;          // 0-100
  growth_trajectory: number;      // 0-100
  release_consistency: number;    // 0-100
  professionalism: number;        // 0-100
  revenue_business: number;       // 0-100
  multi_platform_presence: number;// 0-100
}

export const DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  audience_size: 0.30,
  growth_trajectory: 0.15,
  release_consistency: 0.15,
  professionalism: 0.15,
  revenue_business: 0.15,
  multi_platform_presence: 0.10,
};

export interface SurveyResponse {
  years_releasing: 'lt_6m' | '6m_1y' | '1_3y' | '3_5y' | 'gt_5y';
  shows_performed: '0' | '1_10' | '10_50' | '50_200' | 'gt_200';
  lives_from_music: 'no' | 'partial' | 'yes';
  monthly_revenue: 'zero' | '1k_2k' | '2k_5k' | '5k_15k' | 'gt_15k';
  has_management: 'none' | 'partnership' | 'traditional';
  release_frequency: 'sporadic' | 'quarterly' | 'monthly' | 'weekly';
  main_goal_12m: 'discovery' | 'grow_base' | 'monetize' | 'sign_contract' | 'internationalize';
  primary_genre: string;          // free text (ex: "indie rock", "MPB", "trap")
  city: string;                   // free text
  has_press_kit: 'none' | 'basic' | 'complete';
  production_quality: 'home' | 'simple_studio' | 'professional';
  rights_registration: 'none' | 'partial' | 'complete';
}

export interface SpotifyArtistData {
  spotify_artist_id: string;
  spotify_url: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number;              // 0-100 do Spotify
  monthly_listeners?: number;      // pode ser null se nao conseguimos obter
  top_tracks: SpotifyTrack[];      // top 10
  audio_features_avg?: AudioFeaturesAvg;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  duration_ms: number;
  album_image_url: string | null;
}

export interface AudioFeaturesAvg {
  energy: number;       // 0-1
  danceability: number; // 0-1
  valence: number;      // 0-1 (mood: 0=sad, 1=happy)
  acousticness: number;
  instrumentalness: number;
  tempo: number;        // BPM
}

export interface ActionPlanItem {
  title: string;
  description: string;
  impact_expected: string;  // ex: "+15% monthly listeners"
  deadline_days: 7 | 30 | 60 | 90;
  priority: 1 | 2 | 3;      // 1=high, 3=low
}

export interface DiagnosticText {
  summary: string;            // paragrafo geral do diagnostico
  strengths: string[];        // 3-4 bullets
  weaknesses: string[];       // 3-4 bullets
  opportunities: string[];    // 3-4 bullets
  metric_readings: {          // leituras IA para cada metrica do Raio-X
    monthly_listeners: string;
    growth_rate: string;
    release_consistency: string;
    engagement: string;
  };
}

export interface DiagnosticResult {
  id: string;
  user_id: string;
  stage: Stage;
  stage_score: number;
  dimension_scores: DimensionScores;
  diagnostic_text: DiagnosticText;
  action_plan: ActionPlanItem[];
  created_at: string;
  artist_data_snapshot: SpotifyArtistData;
  survey_snapshot: SurveyResponse;
}
