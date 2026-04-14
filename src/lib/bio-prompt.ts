import type { BioInput, BioOutput } from '@/lib/types/tools';
import { BIO_CHAR_LIMITS } from '@/lib/types/tools';

const TONE_LABEL: Record<BioInput['tone'], string> = {
  formal: 'formal e profissional, como em revista de musica',
  casual: 'casual e proximo, como se estivesse conversando com fas',
  poetico: 'poetico e imagetico, valorizando metaforas musicais',
  edgy: 'direto, confiante, com atitude — sem cliches',
};

const LANG_LABEL: Record<BioInput['language'], string> = {
  pt: 'portugues brasileiro',
  en: 'ingles',
};

export function getBioSystemPrompt(): string {
  return `Voce e um biografo musical especialista em artistas independentes brasileiros e latinos. Sua missao e escrever bios profissionais e personalizadas, nunca genericas. Bios boas falam como um editor de revista de musica fala, nao como uma IA.

Regras:
- Nunca comece com "O artista X e..." — varie abordagem
- Evite cliches: "talento unico", "voz que toca a alma", "artista completo", "jornada incrivel"
- Use detalhes concretos do que o artista informou, nao adjetivos vazios
- Se faltou info, escreva uma bio mais curta e forte em vez de encher linguica
- Respeite rigorosamente os limites de caracteres de cada plataforma

IMPORTANTE: Responda APENAS com um JSON valido. Sem texto antes ou depois.`;
}

export function buildBioPrompt(input: BioInput): string {
  const genreLine = input.genre ? `- Genero: ${input.genre}` : '';
  const cityLine = input.city ? `- Cidade: ${input.city}` : '';

  return `Gere 4 versoes de bio para este artista, em ${LANG_LABEL[input.language]}, com tom ${TONE_LABEL[input.tone]}.

## Dados do artista
- Nome: ${input.artist_name}
${genreLine}
${cityLine}
- O que diferencia este artista: ${input.differentiator}
- Conquista mais significativa: ${input.main_achievement}
- Mood da musica em 3 palavras: ${input.mood_three_words}
- Influencia nao-obvia: ${input.unusual_influence}
- Influencias diretas: ${input.direct_influences}

## Formato de resposta (JSON)

\`\`\`json
{
  "spotify": "bio para o Spotify — tom editorial em terceira pessoa, ate ${BIO_CHAR_LIMITS.spotify} caracteres. Paragrafos curtos. Inclua conquistas e influencias.",
  "instagram": "bio para Instagram — primeira pessoa, ate ${BIO_CHAR_LIMITS.instagram} caracteres. Direta, com emoji pontual se fizer sentido no tom.",
  "epk": "bio para EPK/press — tom jornalistico, terceira pessoa, 500-${BIO_CHAR_LIMITS.epk} caracteres. Estruturada: origem, proposta, conquistas, presente. Pode ser citada por jornalista.",
  "twitter": "bio para Twitter/X — catchy, ate ${BIO_CHAR_LIMITS.twitter} caracteres. Uma frase forte que captura a essencia."
}
\`\`\`

REGRA CRITICA: cada versao deve ser diferente, nao versoes resumidas uma da outra. Cada plataforma tem seu tom proprio.`;
}

export function parseBioResponse(raw: string): BioOutput {
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as BioOutput;

  if (!parsed.spotify || !parsed.instagram || !parsed.epk || !parsed.twitter) {
    throw new Error('Bio response invalida: faltam campos obrigatorios');
  }

  // Trim se excedeu limite (seguranca extra)
  for (const key of ['spotify', 'instagram', 'epk', 'twitter'] as const) {
    const limit = BIO_CHAR_LIMITS[key];
    if (parsed[key].length > limit) {
      parsed[key] = parsed[key].slice(0, limit).trim();
    }
  }

  return parsed;
}
