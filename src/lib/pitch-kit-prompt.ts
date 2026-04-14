import type { PitchInput, PitchOutput, PitchRecipientType, PitchTone, PitchLanguage } from '@/lib/types/tools';
import { PITCH_RECIPIENT_META } from '@/lib/types/tools';

const TONE_DESCRIPTION: Record<PitchTone, string> = {
  professional: 'profissional e polido — como se escreve pra uma redacao de revista de musica',
  casual: 'casual e direto — como um musico conversando com outro',
  bold: 'ousado e confiante — sem pedir desculpa por existir, mas tambem sem arrogancia',
};

const LANG_DESCRIPTION: Record<PitchLanguage, string> = {
  pt: 'portugues brasileiro natural e contemporaneo (evite "prezado" ou formalismos exagerados)',
  en: 'ingles fluente e contemporaneo (music industry english, nao academico)',
};

/**
 * Brief especifico por tipo de destinatario: qual angulo funciona melhor pra cada um.
 */
const RECIPIENT_ANGLE: Record<PitchRecipientType, string> = {
  playlist_curator_indie:
    'Curadores indie valorizam: (1) texto curto, (2) link direto da musica, (3) 1-2 linhas do que a musica tem de especifico (nao genericos), (4) por que ela cabe na playlist dele. Nao fazer venda — conversar.',
  playlist_curator_mainstream:
    'Curadores de playlists grandes recebem centenas de pitches/semana. Precisam de: (1) assunto matador, (2) primeira linha que diferencia, (3) numeros de credibilidade (ouvintes, streams recentes, imprensa), (4) link + 1-pager em anexo.',
  music_blog:
    'Jornalistas de blog buscam angulo editorial: qual e a historia? Conecte a musica a algo mais amplo (movimento, cena, tema). Nao venda — ofereca um angulo.',
  radio_station:
    'Radio quer saber: duracao, BPM, linguagem adequada (parental advisory?), qualidade de gravacao. Seja tecnico + comercial.',
  booker_small_venue:
    'Booker de casa de show quer saber: draw (quantos fas voce puxa), historico de shows, rider basico, pretensao de cache. Tom pratico e objetivo.',
  booker_festival:
    'Booker de festival quer saber: releases recentes, engagement nas plataformas, publico compativel com o festival, materiais de show ao vivo (videos). Leve 2 linhas sobre performance ao vivo.',
  small_label:
    'Selo pequeno quer: quimica artistica, o que voce leva que eles nao tem ainda, planos proprios (voce nao esta largando tudo na mao deles). Seja genuino.',
  major_label:
    'Selo grande olha numeros: ouvintes, crescimento, potencial comercial, diferencial. Escreva como alguem que esta crescendo e sabe disso.',
  music_journalist:
    'Jornalista quer historia. Contexto, conflito, transformacao. Nao diga "sou unico" — mostre qual e a tensao/singularidade real.',
  tastemaker_influencer:
    'Influencer responde melhor a autenticidade. Pessoal, direto, sem paleta de marketing. Fale da propria pessoa dele quando possivel.',
};

export function getPitchSystemPrompt(): string {
  return `Voce e um especialista em comunicacao de artistas musicais, com 15 anos de experiencia em labels, assessorias e midia musical brasileira/internacional. Sua especialidade e escrever pitches que **curadores, bookers e jornalistas realmente leem ate o fim**.

Principios que voce sempre segue:
1. Zero cliches: "voz unica", "artista completo", "jornada incrivel", "talento promissor". Proibido.
2. Concreto sempre: ao inves de "tem crescido muito", diga "2.3k listeners em marco virou 8.1k em abril".
3. Linha de assunto importa mais que o corpo. 70% abrem ou nao por causa dela.
4. Pitch curto supera pitch longo. Email de 120 palavras bate email de 500.
5. Respeite o tempo do destinatario — va direto ao ponto.

IMPORTANTE: Responda APENAS com um JSON valido seguindo a estrutura pedida. Sem texto antes ou depois.`;
}

export function buildPitchPrompt(input: PitchInput): string {
  const recipientLabel = PITCH_RECIPIENT_META[input.recipient_type].label;
  const recipientAngle = RECIPIENT_ANGLE[input.recipient_type];
  const releaseStatus = input.release_date
    ? `Lancamento em ${input.release_date}`
    : 'Ainda nao lancou (pitch pre-release)';

  return `Crie um pitch kit coordenado em ${LANG_DESCRIPTION[input.language]} para este artista, com tom ${TONE_DESCRIPTION[input.tone]}.

## Artista e musica
- Nome artistico: ${input.artist_name}
- Musica/release: ${input.song_title}
- Tipo: ${input.release_type}
- Genero: ${input.genre_primary}
- Mood em 3 palavras: ${input.mood_keywords}
- Status: ${releaseStatus}
${input.song_spotify_url ? `- URL Spotify: ${input.song_spotify_url}` : ''}

## Credibilidade
- Conquistas recentes: ${input.achievements}
- Artistas similares (pra referencia): ${input.similar_artists}

## Destinatario
- Tipo: ${recipientLabel}
- Nome: ${input.recipient_name}
- Entidade: ${input.recipient_entity}

## Angulo especifico para esse destinatario
${recipientAngle}

## Tarefa
Gere a resposta APENAS no formato JSON abaixo:

\`\`\`json
{
  "email_subject": "Linha de assunto curta (max 70 chars). Especifica, nao generica. Considere mencionar genero + gancho em uma frase.",
  "email_body": "Email frio curto (100-150 palavras). Estrutura: (1) cumprimento direto pelo nome, (2) 1 linha mostrando que conhece o trabalho dele, (3) apresentacao da musica em 1 frase especifica, (4) 1-2 linhas de credibilidade concreta, (5) link/CTA, (6) assinatura simples.",
  "one_pager": {
    "short_bio": "Bio curta pra 1-pager — 400-500 chars, tom profissional, terceira pessoa, tres pontos chave: quem e o artista, qual seu diferencial, onde esta agora.",
    "highlights": ["3-4 bullets curtos e especificos (numeros, conquistas, releases). Nada generico."],
    "hook_line": "Uma frase marcante (max 80 chars) que resume a proposta do artista. Pode ser usado como headline em material de imprensa."
  },
  "press_release": "Press release completo em 4-6 paragrafos. Tom jornalistico (terceira pessoa). Estrutura: (1) Leadline com gancho editorial, (2) Contexto do artista, (3) Sobre a musica/release, (4) Citacao do artista (direta, 1-2 frases), (5) Dados/credibilidade, (6) Call-to-action final e contato. Usa dados reais informados, nao inventa."
}
\`\`\`

Regras criticas:
- Nao invente numeros que nao foram dados. Se faltou info, escreva mais curto/forte.
- No email_body, use o nome do destinatario (${input.recipient_name}) no cumprimento.
- Se o destinatario for curador de playlist, mencione especificamente encaixe.
- A hook_line NUNCA deve ser generica ("artista promissor").
- Press release: evite "voz unica", "estilo inconfundivel", "jornada inspiradora".`;
}

export function parsePitchResponse(raw: string): PitchOutput {
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as PitchOutput;

  if (!parsed.email_subject || !parsed.email_body || !parsed.one_pager || !parsed.press_release) {
    throw new Error('Pitch response invalido: faltam campos');
  }
  if (!parsed.one_pager.short_bio || !Array.isArray(parsed.one_pager.highlights) || !parsed.one_pager.hook_line) {
    throw new Error('Pitch one_pager invalido');
  }

  return parsed;
}
