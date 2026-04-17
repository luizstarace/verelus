import { describe, it, expect } from 'vitest';
import {
  HELP_TEXTS,
  CACHE_PRESETS,
  GOAL_BENCHMARKS,
  CLAUSE_HELP,
  RECIPIENT_PREVIEWS,
  PHASE_STRATEGY,
  TONE_DESCRIPTIONS,
} from '@/lib/tool-content';

describe('tool-content', () => {
  it('HELP_TEXTS has all required keys', () => {
    expect(HELP_TEXTS.cache).toBeDefined();
    expect(HELP_TEXTS.breakEven).toBeDefined();
    expect(HELP_TEXTS.exclusivity).toBeDefined();
    expect(HELP_TEXTS.pitchCurator).toBeDefined();
  });

  it('CACHE_PRESETS has at least 3 presets', () => {
    expect(CACHE_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(CACHE_PRESETS[0].label).toBeDefined();
    expect(CACHE_PRESETS[0].values).toBeDefined();
  });

  it('GOAL_BENCHMARKS covers all growth sources', () => {
    expect(GOAL_BENCHMARKS.spotify_listeners).toBeDefined();
    expect(GOAL_BENCHMARKS.youtube_subscribers).toBeDefined();
    expect(GOAL_BENCHMARKS.instagram_followers).toBeDefined();
    expect(GOAL_BENCHMARKS.tiktok_followers).toBeDefined();
  });

  it('CLAUSE_HELP entries have what/when fields', () => {
    const entries = Object.values(CLAUSE_HELP);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((e) => {
      expect(e.what).toBeDefined();
      expect(e.when).toBeDefined();
    });
  });

  it('RECIPIENT_PREVIEWS covers playlist, radio, journalist', () => {
    expect(RECIPIENT_PREVIEWS.playlist_curator).toBeDefined();
    expect(RECIPIENT_PREVIEWS.journalist).toBeDefined();
  });

  it('PHASE_STRATEGY explains each content calendar phase', () => {
    expect(PHASE_STRATEGY.teaser).toBeDefined();
    expect(PHASE_STRATEGY.countdown).toBeDefined();
    expect(PHASE_STRATEGY.launch).toBeDefined();
  });

  it('TONE_DESCRIPTIONS covers all tone options', () => {
    expect(TONE_DESCRIPTIONS.formal).toBeDefined();
    expect(TONE_DESCRIPTIONS.casual).toBeDefined();
    expect(TONE_DESCRIPTIONS.poetico).toBeDefined();
    expect(TONE_DESCRIPTIONS.edgy).toBeDefined();
  });
});
