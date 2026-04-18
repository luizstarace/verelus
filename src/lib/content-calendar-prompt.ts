import type { ContentCalendarInput, ContentCalendarOutput, PostPlatform } from '@/lib/types/tools';

const PLATFORM_GUIDANCE: Record<PostPlatform, string> = {
  instagram_reel: 'Vídeo vertical 15-30s. Horário ótimo: 19h-21h dias de semana.',
  instagram_feed: 'Foto/carrossel. Horário ótimo: 11h-13h ou 19h-21h.',
  instagram_story: 'Efêmero. Use pra countdown, enquetes, bastidores crus.',
  tiktok: 'Vídeo vertical 15-60s. Gancho no primeiro 1s. Horário ótimo: 18h-22h.',
  twitter: 'Texto curto + link. Horário: 9h-11h ou 18h-20h.',
  youtube_shorts: 'Vertical até 60s. Horário: 17h-21h.',
};

export function getContentCalendarSystemPrompt(): string {
  return `Você é um estrategista de social media com 10 anos de experiência em lançamentos de música indie no Brasil. Você conhece os algoritmos de Instagram, TikTok e YouTube Shorts como poucos.

Princípios:
1. Gere prompts de imagem ESPECÍFICOS e USÁVEIS. Ex: "Close preto e branco do vocalista no estúdio, luz tungsten quente, foco no microfone, estilo Wong Kar-wai". Não: "Uma foto legal do artista".
2. Captions curtas e com alma. Máximo 2-3 frases. Zero clichês tipo "Não percam!" ou "Novidades chegando!".
3. Hashtags otimizadas para BR: misture hashtags de gênero (#indiebr), cena (#indierockbr), gerais (#musicaindependente) e nicho (até 15 total).
4. Cada dia tem UM post. Não encha o cronograma — qualidade > volume.
5. Intensidade progressiva: teaser sutil (D-30) -> preview (D-10) -> countdown (D-7) -> lançamento (D0) -> reação (D+3).

IMPORTANTE: Responda APENAS com um JSON válido. Sem texto antes ou depois.`;
}

export function buildContentCalendarPrompt(input: ContentCalendarInput): string {
  const w = input.window_days ?? 30;
  const platformList = input.platforms
    .map((p) => `- ${p}: ${PLATFORM_GUIDANCE[p]}`)
    .join('\n');

  const postCount = w === 15 ? '8-12' : w === 60 ? '25-35' : '15-20';

  const distribution = w === 15
    ? `- **D-15 a D-8** (teaser + curiosidade): 3-4 posts, sem revelar áudio
- **D-7 a D-1** (preview + countdown): 3-4 posts com trechos, pre-save, contagem regressiva
- **D-0** (release): 1-2 posts coordenados anunciando
- **D+1 a D+7** (pós): 2-3 posts de reação, agradecimento`
    : w === 60
    ? `- **D-60 a D-45** (pre-teaser): 3-4 posts ambientais, visual identity, mood board
- **D-44 a D-30** (teaser): 3-4 posts conceituais, bastidores crus
- **D-29 a D-15** (construindo curiosidade): 4-5 posts com bastidores detalhados, quotes
- **D-14 a D-7** (preview): 4-5 posts com trechos de 15s, pre-save
- **D-6 a D-1** (countdown): 3-4 posts de contagem regressiva, capa final
- **D-0** (release): 2-3 posts coordenados anunciando
- **D+1 a D+7** (pós): 3-4 posts de reação, bastidores do lançamento, números`
    : `- **D-30 a D-22** (teaser inicial): 2-3 posts conceituais, sem revelar áudio
- **D-21 a D-14** (construindo curiosidade): 3-4 posts com bastidores, quotes da letra
- **D-13 a D-7** (preview): 3-4 posts com trechos de 15s da música, pre-save
- **D-6 a D-1** (countdown): 3-4 posts de contagem regressiva, capa final
- **D-0** (release): 2-3 posts coordenados anunciando
- **D+1 a D+7** (pós): 2-3 posts de reação, agradecimento, bastidores do lançamento`;

  return `Gere um cronograma de ${w} dias de posts coordenados para o lançamento:

## Release
- Artista: ${input.artist_name}
- Título: ${input.song_title}
- Tipo: ${input.release_type}
- Data de lançamento: ${input.release_date}
- Gênero: ${input.genre}
- Mood: ${input.mood}

## Plataformas ativas
${platformList}

## Tarefa

Gere ${postCount} posts distribuídos entre D-${w} e D+7. Cada post em uma plataforma específica. Distribuição típica:

${distribution}

Responda APENAS no formato JSON abaixo:

\`\`\`json
{
  "summary": "Parágrafo curto (2-3 frases) explicando a estratégia geral do cronograma em português",
  "posts": [
    {
      "day_offset": -30,
      "platform": "instagram_reel",
      "post_type": "Teaser conceitual",
      "caption_draft": "Texto em português BR, 2-3 frases, natural, sem clichês",
      "hashtags": ["10-15 hashtags otimizadas BR"],
      "image_prompt": "Prompt específico pra Midjourney/DALL-E/Flux gerar o visual. Inclua: composição, iluminação, estética, referência visual.",
      "best_time": "19h-21h",
      "notes": "Dica curta e acionável"
    }
  ]
}
\`\`\`

Regras:
- day_offset: número inteiro entre -${w} e +7
- platform: apenas valores da lista de plataformas ativas informadas
- image_prompt: NÃO é opcional — sempre inclua. Mas não precisa em posts de twitter (coloque null).
- Cada post DEVE ser diferente dos outros. Não repita temas.
- Posts de D-0 podem ser múltiplos (1 por plataforma).`;
}

export function parseContentCalendarResponse(raw: string): ContentCalendarOutput {
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as ContentCalendarOutput;

  if (!parsed.summary || !Array.isArray(parsed.posts)) {
    throw new Error('Content calendar response inválido');
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
