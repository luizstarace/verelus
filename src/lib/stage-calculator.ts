import type {
  SpotifyArtistData,
  SurveyResponse,
  DimensionScores,
  Stage,
} from '@/lib/types/career';
import { DIMENSION_WEIGHTS } from '@/lib/types/career';

/**
 * Mapeia score numerico (0-100) para estagio.
 * Ranges: 0-20 Inicial, 21-40 Emergente, 41-60 Consolidado, 61-80 Estabelecido, 81-100 Referencia.
 */
export function stageFromScore(score: number): Stage {
  if (score <= 20) return 'Inicial';
  if (score <= 40) return 'Emergente';
  if (score <= 60) return 'Consolidado';
  if (score <= 80) return 'Estabelecido';
  return 'Referencia';
}

/**
 * Score de audiencia (0-100) baseado em monthly_listeners + followers.
 * Se monthly_listeners estiver ausente, usa proxy: min(followers * 2, popularity * 10000).
 */
export function scoreAudienceSize(data: SpotifyArtistData): number {
  const listeners = data.monthly_listeners ?? Math.min(data.followers * 2, (data.popularity ?? 0) * 10000);
  if (listeners >= 500_000) return 100;
  if (listeners >= 100_000) return 85;
  if (listeners >= 50_000) return 70;
  if (listeners >= 10_000) return 55;
  if (listeners >= 5_000) return 40;
  if (listeners >= 1_000) return 25;
  if (listeners >= 500) return 15;
  if (listeners >= 100) return 8;
  if (listeners > 0) return 3;
  return 0;
}

/**
 * Score de crescimento (0-100).
 * MVP usa release_frequency + years_releasing como proxy
 * (nao temos historico de listeners ainda).
 */
export function scoreGrowthTrajectory(survey: SurveyResponse): number {
  const freqScore: Record<SurveyResponse['release_frequency'], number> = {
    sporadic: 20,
    quarterly: 50,
    monthly: 80,
    weekly: 100,
  };
  const yearsScore: Record<SurveyResponse['years_releasing'], number> = {
    lt_6m: 60,
    '6m_1y': 70,
    '1_3y': 80,
    '3_5y': 70,
    gt_5y: 50,
  };
  return Math.round((freqScore[survey.release_frequency] + yearsScore[survey.years_releasing]) / 2);
}

/**
 * Score de consistencia de lancamento (0-100) baseado em release_frequency.
 */
export function scoreReleaseConsistency(survey: SurveyResponse): number {
  const map: Record<SurveyResponse['release_frequency'], number> = {
    sporadic: 20,
    quarterly: 50,
    monthly: 80,
    weekly: 100,
  };
  return map[survey.release_frequency];
}

/**
 * Score de profissionalismo (0-100) baseado em press_kit + production_quality + rights_registration.
 */
export function scoreProfessionalism(survey: SurveyResponse): number {
  const pressKit: Record<SurveyResponse['has_press_kit'], number> = {
    none: 0,
    basic: 50,
    complete: 100,
  };
  const production: Record<SurveyResponse['production_quality'], number> = {
    home: 30,
    simple_studio: 65,
    professional: 100,
  };
  const rights: Record<SurveyResponse['rights_registration'], number> = {
    none: 0,
    partial: 50,
    complete: 100,
  };
  return Math.round(
    pressKit[survey.has_press_kit] * 0.35 +
    production[survey.production_quality] * 0.35 +
    rights[survey.rights_registration] * 0.30
  );
}

/**
 * Score de receita e negocio (0-100) baseado em lives_from_music + monthly_revenue + has_management.
 */
export function scoreRevenueBusiness(survey: SurveyResponse): number {
  const lives: Record<SurveyResponse['lives_from_music'], number> = {
    no: 0,
    partial: 50,
    yes: 100,
  };
  const revenue: Record<SurveyResponse['monthly_revenue'], number> = {
    zero: 0,
    '1k_2k': 20,
    '2k_5k': 50,
    '5k_15k': 80,
    gt_15k: 100,
  };
  const mgmt: Record<SurveyResponse['has_management'], number> = {
    none: 0,
    partnership: 50,
    traditional: 100,
  };
  return Math.round(
    lives[survey.lives_from_music] * 0.40 +
    revenue[survey.monthly_revenue] * 0.40 +
    mgmt[survey.has_management] * 0.20
  );
}

/**
 * Score de presenca multiplataforma (0-100) baseado em quantas redes sociais foram informadas.
 */
export function scoreMultiPlatformPresence(socialUrls: Record<string, string | undefined>): number {
  const active = Object.values(socialUrls).filter((v) => v && v.trim().length > 0).length;
  if (active === 0) return 0;
  if (active === 1) return 50;
  if (active === 2) return 80;
  return 100;
}

/**
 * Calcula estagio final e scores por dimensao.
 */
export function calculateStage(
  spotify: SpotifyArtistData,
  survey: SurveyResponse,
  socialUrls: Record<string, string | undefined>
): { stage: Stage; score: number; dimensions: DimensionScores } {
  const dimensions: DimensionScores = {
    audience_size: scoreAudienceSize(spotify),
    growth_trajectory: scoreGrowthTrajectory(survey),
    release_consistency: scoreReleaseConsistency(survey),
    professionalism: scoreProfessionalism(survey),
    revenue_business: scoreRevenueBusiness(survey),
    multi_platform_presence: scoreMultiPlatformPresence(socialUrls),
  };

  const weightedScore =
    dimensions.audience_size * DIMENSION_WEIGHTS.audience_size +
    dimensions.growth_trajectory * DIMENSION_WEIGHTS.growth_trajectory +
    dimensions.release_consistency * DIMENSION_WEIGHTS.release_consistency +
    dimensions.professionalism * DIMENSION_WEIGHTS.professionalism +
    dimensions.revenue_business * DIMENSION_WEIGHTS.revenue_business +
    dimensions.multi_platform_presence * DIMENSION_WEIGHTS.multi_platform_presence;

  const finalScore = Math.round(weightedScore);
  return {
    stage: stageFromScore(finalScore),
    score: finalScore,
    dimensions,
  };
}
