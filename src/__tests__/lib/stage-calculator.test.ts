import { describe, it, expect } from 'vitest';
import {
  calculateStage,
  scoreAudienceSize,
  scoreGrowthTrajectory,
  scoreReleaseConsistency,
  scoreProfessionalism,
  scoreRevenueBusiness,
  scoreMultiPlatformPresence,
  stageFromScore,
} from '@/lib/stage-calculator';
import type { SpotifyArtistData, SurveyResponse } from '@/lib/types/career';

const baseSpotify: SpotifyArtistData = {
  spotify_artist_id: 'x',
  spotify_url: 'x',
  name: 'Test',
  genres: ['indie'],
  followers: 0,
  popularity: 0,
  top_tracks: [],
};

const baseSurvey: SurveyResponse = {
  years_releasing: 'lt_6m',
  shows_performed: '0',
  lives_from_music: 'no',
  monthly_revenue: 'zero',
  has_management: 'none',
  release_frequency: 'sporadic',
  main_goal_12m: 'discovery',
  primary_genre: 'indie',
  city: 'Sao Paulo',
  has_press_kit: 'none',
  production_quality: 'home',
  rights_registration: 'none',
};

describe('stageFromScore', () => {
  it('maps 0-20 to Inicial', () => {
    expect(stageFromScore(0)).toBe('Inicial');
    expect(stageFromScore(20)).toBe('Inicial');
  });
  it('maps 21-40 to Emergente', () => {
    expect(stageFromScore(21)).toBe('Emergente');
    expect(stageFromScore(40)).toBe('Emergente');
  });
  it('maps 41-60 to Consolidado', () => {
    expect(stageFromScore(41)).toBe('Consolidado');
    expect(stageFromScore(60)).toBe('Consolidado');
  });
  it('maps 61-80 to Estabelecido', () => {
    expect(stageFromScore(61)).toBe('Estabelecido');
    expect(stageFromScore(80)).toBe('Estabelecido');
  });
  it('maps 81-100 to Referencia', () => {
    expect(stageFromScore(81)).toBe('Referencia');
    expect(stageFromScore(100)).toBe('Referencia');
  });
});

describe('scoreAudienceSize', () => {
  it('returns 0 for 0 listeners', () => {
    expect(scoreAudienceSize({ ...baseSpotify, monthly_listeners: 0, followers: 0 })).toBe(0);
  });
  it('returns low score for <500 listeners', () => {
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: 300, followers: 100 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(20);
  });
  it('returns mid score for 5k-50k listeners', () => {
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: 10000, followers: 5000 });
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });
  it('returns 100 for 500k+ listeners', () => {
    expect(scoreAudienceSize({ ...baseSpotify, monthly_listeners: 800000, followers: 500000 })).toBe(100);
  });
  it('uses popularity-based proxy when monthly_listeners missing', () => {
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: undefined, followers: 100000, popularity: 70 });
    expect(score).toBeGreaterThan(40);
  });
});

describe('scoreReleaseConsistency', () => {
  it('returns 20 for sporadic frequency', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'sporadic' })).toBe(20);
  });
  it('returns 50 for quarterly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'quarterly' })).toBe(50);
  });
  it('returns 80 for monthly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'monthly' })).toBe(80);
  });
  it('returns 100 for weekly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'weekly' })).toBe(100);
  });
});

describe('scoreProfessionalism', () => {
  it('returns low for no press kit + home production', () => {
    const score = scoreProfessionalism({
      ...baseSurvey,
      has_press_kit: 'none',
      production_quality: 'home',
      rights_registration: 'none',
    });
    expect(score).toBeLessThan(20);
  });
  it('returns high for complete press kit + professional + rights', () => {
    const score = scoreProfessionalism({
      ...baseSurvey,
      has_press_kit: 'complete',
      production_quality: 'professional',
      rights_registration: 'complete',
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });
});

describe('scoreRevenueBusiness', () => {
  it('returns 0 for not living from music + no revenue + no management', () => {
    expect(scoreRevenueBusiness({
      ...baseSurvey,
      lives_from_music: 'no',
      monthly_revenue: 'zero',
      has_management: 'none',
    })).toBe(0);
  });
  it('returns 100 for living from music + high revenue + traditional management', () => {
    expect(scoreRevenueBusiness({
      ...baseSurvey,
      lives_from_music: 'yes',
      monthly_revenue: 'gt_15k',
      has_management: 'traditional',
    })).toBe(100);
  });
});

describe('scoreMultiPlatformPresence', () => {
  it('returns 0 for no socials', () => {
    expect(scoreMultiPlatformPresence({})).toBe(0);
  });
  it('returns 50 for 1 social', () => {
    expect(scoreMultiPlatformPresence({ instagram: 'https://instagram.com/x' })).toBe(50);
  });
  it('returns 100 for 3+ socials', () => {
    expect(scoreMultiPlatformPresence({
      instagram: 'x',
      tiktok: 'x',
      youtube: 'x',
    })).toBe(100);
  });
});

describe('scoreGrowthTrajectory', () => {
  it('returns non-zero for any input', () => {
    const score = scoreGrowthTrajectory(baseSurvey);
    expect(score).toBeGreaterThan(0);
  });
  it('higher score for monthly release + 1-3 years', () => {
    const low = scoreGrowthTrajectory({ ...baseSurvey, release_frequency: 'sporadic', years_releasing: 'gt_5y' });
    const high = scoreGrowthTrajectory({ ...baseSurvey, release_frequency: 'monthly', years_releasing: '1_3y' });
    expect(high).toBeGreaterThan(low);
  });
});

describe('calculateStage (integracao)', () => {
  it('classifies artista novo como Inicial', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 100, followers: 50 },
      baseSurvey,
      {}
    );
    expect(result.stage).toBe('Inicial');
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it('classifies artista meio-caminho em Consolidado ou proximo', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 15000, followers: 8000, popularity: 40 },
      {
        ...baseSurvey,
        years_releasing: '3_5y',
        shows_performed: '50_200',
        lives_from_music: 'partial',
        monthly_revenue: '2k_5k',
        release_frequency: 'monthly',
        has_press_kit: 'basic',
        production_quality: 'simple_studio',
        rights_registration: 'partial',
      },
      { instagram: 'x', tiktok: 'x' }
    );
    expect(['Emergente', 'Consolidado', 'Estabelecido']).toContain(result.stage);
  });

  it('classifies artista estabelecido como Referencia', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 800000, followers: 500000, popularity: 80 },
      {
        ...baseSurvey,
        years_releasing: 'gt_5y',
        shows_performed: 'gt_200',
        lives_from_music: 'yes',
        monthly_revenue: 'gt_15k',
        has_management: 'traditional',
        release_frequency: 'monthly',
        has_press_kit: 'complete',
        production_quality: 'professional',
        rights_registration: 'complete',
      },
      { instagram: 'x', tiktok: 'x', youtube: 'x' }
    );
    expect(result.stage).toBe('Referencia');
    expect(result.score).toBeGreaterThanOrEqual(81);
  });
});
