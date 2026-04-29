// Curated ElevenLabs voices that perform well in Brazilian Portuguese via the
// `eleven_multilingual_v2` model. IDs are public ElevenLabs library voices and
// work on any account with an ELEVENLABS_API_KEY.
//
// Three feminine + three masculine. Each has a short label aimed at a Brazilian
// PME owner (no jargon).

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'feminine' | 'masculine';
  hint: string;
}

export const ATALAIA_VOICES: VoiceOption[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'feminine',
    hint: 'Profissional e calma — boa pra clínica, escritório',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    gender: 'feminine',
    hint: 'Jovem e simpática — boa pra salão, loja, restaurante',
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    gender: 'feminine',
    hint: 'Madura e elegante — boa pra serviços premium',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'masculine',
    hint: 'Confiante e profissional — boa pra serviços formais',
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    gender: 'masculine',
    hint: 'Jovem e amigável — boa pra atendimento casual',
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    gender: 'masculine',
    hint: 'Maduro e tranquilo — boa pra clientela mais velha',
  },
];

export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export function isAllowedVoiceId(id: string | null | undefined): boolean {
  if (!id || id === 'default') return true;
  return ATALAIA_VOICES.some((v) => v.id === id);
}

export function resolveVoiceId(id: string | null | undefined): string {
  if (!id || id === 'default') return DEFAULT_VOICE_ID;
  return id;
}
