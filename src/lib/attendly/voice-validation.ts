export const MAX_VOICE_TEXT_LEN = 5000;

export type VoiceValidation =
  | { ok: true }
  | { ok: false; error: string; status: number };

export function validateVoiceInput(message_id: unknown, text: unknown): VoiceValidation {
  if (!message_id || typeof message_id !== 'string') {
    return { ok: false, error: 'message_id and text required', status: 400 };
  }
  if (!text || typeof text !== 'string') {
    return { ok: false, error: 'message_id and text required', status: 400 };
  }
  if (text.length > MAX_VOICE_TEXT_LEN) {
    return {
      ok: false,
      error: `Texto muito longo. Máximo ${MAX_VOICE_TEXT_LEN} caracteres.`,
      status: 400,
    };
  }
  return { ok: true };
}

// ElevenLabs bills per second of audio. A reasonable estimate is 750 chars per minute
// of narration (PT-BR). Used to increment voice_usage before the audio even finishes
// streaming, so limits are enforced pre-overage.
export function estimateVoiceSeconds(text: string): number {
  return Math.ceil((text.length / 750) * 60);
}
