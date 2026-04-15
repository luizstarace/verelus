import type { ContentCalendarInput, ContentCalendarOutput, PostPlatform } from '@/lib/types/tools';

const PLATFORM_GUIDANCE: Record<PostPlatform, string> = {
  instagram_reel: 'Video vertical 15-30s. Horario otimo: 19h-21h dias de semana.',
  instagram_feed: 'Foto/carrossel. Horario otimo: 11h-13h ou 19h-21h.',
  instagram_story: 'Efemero. Use pra countdown, enquetes, bastidores crus.',
  tiktok: 'Video vertical 15-60s. Gancho no primeiro 1s. Horario otimo: 18h-22h.',
  twitter: 'Texto curto + link. Horario: 9h-11h ou 18h-20h.',
  youtube_shorts: 'Vertical ate 60s. Horario: 17h-21h.',
};

export function getContentCalendarSystemPrompt(): string {
  return `Voce e um estrategista de social media com 10 anos de experiencia em lancamentos de musica indie no Brasil. Voce conhece os algoritmos de Instagram, TikTok e YouTube Shorts como poucos.

Principios:
1. Gere prompts de imagem ESPECIFICOS e USAVEIS. Ex: "Close preto e branco do vocalista no estudio, luz tungsten quente, foco no microfone, estilo Wong Kar-wai". Nao: "Uma foto legal do artista".
2. Captions curtas e com alma. Maximo 2-3 frases. Zero cliches tipo "Nao percam!" ou "Novidades chegando!".
3. Hashtags otimizadas para BR: misture hashtags de genero (#indiebr), cena (#indierockbr), gerais (#musicaindependente) e nicho (ate 15 total).
4. Cada dia tem UM post. Nao encha o cronograma — qualidade > volume.
5. Intensidade progressiva: teaser sutil (D-30) -> preview (D-10) -> countdown (D-7) -> lancamento (D0) -> reacao (D+3).

IMPORTANTE: Responda APENAS com um JSON valido. Sem texto antes ou depois.`;
}

export function buildContentCalendarPrompt(input: ContentCalendarInput): string {
  const platformList = input.platforms
    .map((p) => `- ${p}: ${PLATFORM_GUIDANCE[p]}`)
    .join('\n');

  return `Gere um cronograma de 30 dias de posts coordenados para o lancamento:

## Release
- Artista: ${input.artist_name}
- Titulo: ${input.song_title}
- Tipo: ${input.release_type}
- Data de lancamento: ${input.release_date}
- Genero: ${input.genre}
- Mood: ${input.mood}

## Plataformas ativas
${platformList}

## Tarefa

Gere 15-20 posts distribuidos entre D-30 e D+7. Cada post em uma plataforma especifica. Distribuicao tipica:

- **D-30 a D-22** (teaser inicial): 2-3 posts conceituais, sem revelar audio
- **D-21 a D-14** (construindo curiosidade): 3-4 posts com bastidores, quotes da letra
- **D-13 a D-7** (preview): 3-4 posts com trechos de 15s da musica, pre-save
- **D-6 a D-1** (countdown): 3-4 posts de contagem regressiva, capa final
- **D-0** (release): 2-3 posts coordenados anunciando
- **D+1 a D+7** (pos): 2-3 posts de reacao, agradecimento, bastidores do lancamento

Responda APENAS no formato JSON abaixo:

\`\`\`json
{
  "summary": "Paragrafo curto (2-3 frases) explicando a estrategia geral do cronograma em portugues",
  "posts": [
    {
      "day_offset": -30,
      "platform": "instagram_reel",
      "post_type": "Teaser conceitual",
      "caption_draft": "Texto em portugues BR, 2-3 frases, natural, sem cliches",
      "hashtags": ["10-15 hashtags otimizadas BR"],
      "image_prompt": "Prompt especifico pra Midjourney/DALL-E/Flux gerar o visual. Inclua: composicao, iluminacao, estetica, referencia visual.",
      "best_time": "19h-21h",
      "notes": "Dica curta e acionavel"
    }
  ]
}
\`\`\`

Regras:
- day_offset: numero inteiro entre -30 e +7
- platform: apenas valores da lista de plataformas ativas informadas
- image_prompt: NAO e opcional — sempre inclua. Mas nao precisa em posts de twitter (coloque null).
- Cada post DEVE ser diferente dos outros. Nao repita temas.
- Posts de D-0 podem ser multiplos (1 por plataforma).`;
}

export function parseContentCalendarResponse(raw: string): ContentCalendarOutput {
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as ContentCalendarOutput;

  if (!parsed.summary || !Array.isArray(parsed.posts)) {
    throw new Error('Content calendar response invalido');
  }

  // Calcula suggested_date pra cada post
  return {
    summary: parsed.summary,
    posts: parsed.posts.map((p) => ({ ...p })),
  };
}

export function calculatePostDate(releaseDate: string, dayOffset: number): string {
  const date = new Date(releaseDate + 'T12:00:00');
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}
