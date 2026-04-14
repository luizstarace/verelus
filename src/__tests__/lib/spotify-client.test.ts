import { describe, it, expect } from 'vitest';
import { parseSpotifyArtistId } from '@/lib/spotify-client';

describe('parseSpotifyArtistId', () => {
  it('extracts ID from open.spotify.com URL', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('extracts ID from URL with query string', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02?si=abc123'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('extracts ID from URL with locale prefix', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/intl-pt/artist/06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('accepts bare artist ID', () => {
    expect(parseSpotifyArtistId('06HL4z0CvFAxyc27GXpf02')).toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('accepts spotify URI', () => {
    expect(parseSpotifyArtistId('spotify:artist:06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('returns null for invalid URL', () => {
    expect(parseSpotifyArtistId('https://instagram.com/someone')).toBeNull();
  });

  it('returns null for non-artist URLs', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/track/06HL4z0CvFAxyc27GXpf02')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSpotifyArtistId('')).toBeNull();
  });
});
