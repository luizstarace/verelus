import { describe, it, expect } from 'vitest';
import { buildDiagnosticPrompt, parseDiagnosticResponse } from '@/lib/diagnostic-prompts';
import type { SpotifyArtistData, SurveyResponse, DimensionScores } from '@/lib/types/career';

const fakeSpotify: SpotifyArtistData = {
  spotify_artist_id: 'abc',
  spotify_url: 'https://open.spotify.com/artist/abc',
  name: 'Banda Teste',
  genres: ['indie rock', 'MPB'],
  followers: 5000,
  popularity: 35,
  monthly_listeners: 12000,
  top_tracks: [
    { id: 't1', name: 'Musica 1', popularity: 40, preview_url: null, duration_ms: 180000, album_image_url: null },
  ],
};

const fakeSurvey: SurveyResponse = {
  years_releasing: '3_5y',
  shows_performed: '50_200',
  lives_from_music: 'partial',
  monthly_revenue: '2k_5k',
  has_management: 'none',
  release_frequency: 'quarterly',
  main_goal_12m: 'monetize',
  primary_genre: 'indie rock',
  city: 'Sao Paulo',
  has_press_kit: 'basic',
  production_quality: 'simple_studio',
  rights_registration: 'partial',
};

const fakeDimensions: DimensionScores = {
  audience_size: 55,
  growth_trajectory: 60,
  release_consistency: 50,
  professionalism: 55,
  revenue_business: 45,
  multi_platform_presence: 80,
};

describe('buildDiagnosticPrompt', () => {
  it('inclui nome do artista no prompt', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('Banda Teste');
  });

  it('inclui estagio calculado', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('Consolidado');
  });

  it('inclui instrucao de formato JSON', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('JSON');
  });

  it('inclui todas as dimensoes com scores', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('audience_size');
    expect(prompt).toContain('55');
  });

  it('inclui objetivo do artista para os 12 meses', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('monetize');
  });
});

describe('parseDiagnosticResponse', () => {
  it('parseia resposta JSON bem-formada', () => {
    const raw = JSON.stringify({
      diagnostic_text: {
        summary: 'Voce esta no estagio Consolidado.',
        strengths: ['a', 'b', 'c'],
        weaknesses: ['x', 'y'],
        opportunities: ['o1', 'o2'],
        metric_readings: {
          monthly_listeners: 'voce tem 12k',
          growth_rate: '5%',
          release_consistency: 'trimestral',
          engagement: 'alto',
        },
      },
      action_plan: [
        {
          title: 'Lance single',
          description: 'Lance seu proximo single em 30 dias',
          impact_expected: '+10% listeners',
          deadline_days: 30,
          priority: 1,
        },
      ],
    });
    const result = parseDiagnosticResponse(raw);
    expect(result.diagnostic_text.summary).toContain('Consolidado');
    expect(result.action_plan).toHaveLength(1);
    expect(result.action_plan[0].title).toBe('Lance single');
  });

  it('parseia JSON com markdown code fence', () => {
    const raw = '```json\n{"diagnostic_text":{"summary":"x","strengths":[],"weaknesses":[],"opportunities":[],"metric_readings":{"monthly_listeners":"","growth_rate":"","release_consistency":"","engagement":""}},"action_plan":[]}\n```';
    const result = parseDiagnosticResponse(raw);
    expect(result.diagnostic_text.summary).toBe('x');
  });

  it('throw em JSON invalido', () => {
    expect(() => parseDiagnosticResponse('not json')).toThrow();
  });
});
