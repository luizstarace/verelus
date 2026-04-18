// src/lib/tool-content.ts

export const HELP_TEXTS = {
  cache: 'Cache (cachê) é o valor garantido que o venue/contratante paga pro artista, independente de bilheteria. Cobre o trabalho e as despesas da apresentação.',
  breakEven: 'Break-even é o ponto onde a receita iguala as despesas. Abaixo desse valor você está pagando pra tocar. Acima, entra lucro.',
  exclusivity: 'Cláusula de exclusividade impede o artista de tocar as mesmas músicas em venues concorrentes num raio/período específico. Usada em festivais exclusivos e shows especiais.',
  cancellation: 'Multa por cancelamento protege o artista se o venue cancelar o show. Tipicamente 50% do cachê se cancelado com menos de 30 dias.',
  recordingRights: 'Define se o venue/contratante pode gravar/transmitir o show. Inclui áudio, vídeo, livestream, clipes pra TikTok/Instagram.',
  pitchCurator: 'Curador de playlist: foca em "encaixe" (mood, energia, gênero). Pitch deve enfatizar streams recentes, crescimento, e qual playlist sua faixa se encaixa.',
  pitchJournalist: 'Jornalista: foca em "história" (contexto, ângulo, timing). Pitch deve enfatizar narrativa única, conexão com tendência atual, e quote acionável.',
  pitchRadio: 'Rádio/DJ: foca em "espaço no programa" (duração, estrutura, limpo vs explícito). Pitch curto e direto, menciona duração, disponibilidade de versão radio edit.',
  monthlyListeners: 'Ouvintes mensais únicos no Spotify (não é igual a streams). É o indicador mais importante de alcance real — streams podem ser inflados por poucos fãs.',
  playlistFit: 'Playlist fit: quanto sua música "encaixa" no mood/energia/tempo da playlist. Editores analisam os 30 segundos iniciais — gancho é essencial.',
} as const;

export type HelpTextKey = keyof typeof HELP_TEXTS;

export const CACHE_PRESETS = [
  {
    label: 'Solo acústico',
    description: 'Voz + violão ou piano, sem banda',
    values: {
      band_size: 1,
      gear_transport_cost: 150,
      food_cost: 50,
      rehearsal_hours: 2,
      sound_tech_cost: 0,
    },
  },
  {
    label: 'Duo',
    description: '2 músicos, equipamento mínimo',
    values: {
      band_size: 2,
      gear_transport_cost: 300,
      food_cost: 100,
      rehearsal_hours: 4,
      sound_tech_cost: 200,
    },
  },
  {
    label: 'Banda (5)',
    description: 'Banda completa com backline',
    values: {
      band_size: 5,
      gear_transport_cost: 800,
      food_cost: 250,
      rehearsal_hours: 8,
      sound_tech_cost: 500,
    },
  },
  {
    label: 'Produção full',
    description: '6+ músicos + técnicos + logística',
    values: {
      band_size: 7,
      gear_transport_cost: 1500,
      food_cost: 450,
      rehearsal_hours: 12,
      sound_tech_cost: 1000,
    },
  },
];

export const GOAL_BENCHMARKS: Record<string, { emerging: string; growing: string; established: string }> = {
  spotify_listeners: {
    emerging: '1-5k/mês em 6 meses (artista com <1k listeners hoje)',
    growing: '10-30k/mês em 6 meses (artista com 5-20k listeners hoje)',
    established: '50k-200k/mês em 6 meses (artista com 30k+ listeners hoje)',
  },
  youtube_subscribers: {
    emerging: '200-1k subs em 6 meses',
    growing: '2-5k subs em 6 meses',
    established: '10k+ subs em 6 meses',
  },
  instagram_followers: {
    emerging: '500-2k em 3 meses',
    growing: '3-8k em 3 meses',
    established: '10k+ em 3 meses',
  },
  tiktok_followers: {
    emerging: '1-5k em 3 meses (crescimento imprevisível, depende de viral)',
    growing: '5-20k em 3 meses',
    established: '50k+ em 3 meses',
  },
};

export interface ClauseHelpEntry {
  what: string;
  when: string;
  example?: string;
}

export const CLAUSE_HELP: Record<string, ClauseHelpEntry> = {
  payment_schedule: {
    what: 'Define quando e como o pagamento é feito (sinal, dia do show, após).',
    when: 'Sempre — é o ponto mais importante do contrato.',
    example: 'Padrão BR: 50% na assinatura, 50% no dia do show, até 2h antes do soundcheck.',
  },
  cancellation: {
    what: 'Multa se o venue cancelar o show.',
    when: 'Todo contrato — protege seu trabalho investido em ensaios/logística.',
    example: 'Cancelamento com menos de 30 dias: 50% do cache. Menos de 7 dias: 100%.',
  },
  recording: {
    what: 'Se o venue pode gravar/transmitir o show.',
    when: 'Festivais, venues com canal YouTube, qualquer casa que faça livestream.',
    example: 'Permito gravação de áudio pra uso interno. Vídeo/livestream requer autorização prévia escrita.',
  },
  exclusivity: {
    what: 'Impede tocar em venues concorrentes num raio/período.',
    when: 'Apenas pra festivais exclusivos ou shows especiais — evite em shows normais.',
    example: 'Não tocar as mesmas músicas em venues num raio de 50km, 15 dias antes e depois.',
  },
  force_majeure: {
    what: 'Isenta as partes em caso de força maior (pandemia, tempestade, guerra).',
    when: 'Sempre — é cláusula padrão.',
  },
  rider_technical: {
    what: 'Lista os equipamentos/estrutura necessários (PA, monitores, backline).',
    when: 'Qualquer show com banda ou equipamento específico.',
    example: 'Ver rider técnico anexo. PA mínimo 2kW, 4 monitores, 8 canais de mesa.',
  },
};

export const RECIPIENT_PREVIEWS = {
  playlist_curator: {
    title: 'Pitch para curador de playlist',
    emphasis: [
      'Gênero, mood e BPM (encaixe na playlist)',
      'Streams recentes e crescimento dos últimos 30 dias',
      'Quais playlists similares você está',
      'Duração do gancho (primeiros 15-30s)',
    ],
    avoid: 'Biografia longa. Eles escutam, não leem.',
  },
  journalist: {
    title: 'Pitch para jornalista/imprensa',
    emphasis: [
      'História/ângulo único (por que AGORA?)',
      'Conexão com tendência atual ou contexto',
      'Quote acionável (algo citável em 1 frase)',
      'Contexto do gênero e cena',
    ],
    avoid: 'Releases genéricos ("lança próximo single"). Precisa de ângulo.',
  },
  radio: {
    title: 'Pitch para radio/DJ',
    emphasis: [
      'Duração exata da faixa',
      'Versão radio-edit disponível (se explícito)',
      'Estrutura (intro/verso/gancho)',
      'Data de disponibilidade',
    ],
    avoid: 'História longa. Vá direto ao ponto.',
  },
  sync_licensing: {
    title: 'Pitch para licenciamento (sync)',
    emphasis: [
      'Mood, instrumentação e energia',
      'Se há versão instrumental disponível',
      'Duração e estrutura (beats de 15s, 30s)',
      'Status de publishing (auto-gerido vs editora)',
    ],
    avoid: 'Métricas de streaming (não importam aqui).',
  },
} as const;

export type RecipientType = keyof typeof RECIPIENT_PREVIEWS;

export const PHASE_STRATEGY = {
  teaser: {
    title: 'Teaser (D-30 a D-22)',
    goal: 'Plantar curiosidade sem revelar muito. "Alguma coisa tá vindo."',
    tactics: 'Posts conceituais, bastidores crus, ambientação visual. Evite áudio.',
  },
  curiosity: {
    title: 'Construindo curiosidade (D-21 a D-14)',
    goal: 'Aprofundar interesse. Começar a revelar peças.',
    tactics: 'Bastidores do estúdio, trechos de letra, processo criativo.',
  },
  preview: {
    title: 'Preview (D-13 a D-7)',
    goal: 'Revelar áudio. Ativar pre-save.',
    tactics: 'Trechos de 15s, chamada explicita pra pre-save, contexto da faixa.',
  },
  countdown: {
    title: 'Countdown (D-6 a D-1)',
    goal: 'Gerar urgência. Dia X.',
    tactics: 'Contagem regressiva, capa final, trechos maiores, stories diários.',
  },
  launch: {
    title: 'Lançamento (D-0)',
    goal: 'Maximizar streams das primeiras 48h (algoritmos).',
    tactics: 'Anúncio coordenado em todas plataformas, thank you pros fãs, link em todo lugar.',
  },
  post: {
    title: 'Pós-lançamento (D+1 a D+7)',
    goal: 'Manter momentum. Agradecer. Reagir.',
    tactics: 'Reação aos comentários, bastidores do lançamento, números alcançados, call pra playlists.',
  },
} as const;

export type PhaseKey = keyof typeof PHASE_STRATEGY;

export const TONE_DESCRIPTIONS = {
  formal: 'Profissional, editorial. Usa pra EPK, press releases, booking agents. Evita gíria.',
  casual: 'Amigável, próximo. Usa pra Instagram, dia-a-dia. Fala como se fosse um amigo.',
  poetico: 'Imagético, metafórico. Usa pra artistas de MPB, folk, indie com peso literário.',
  edgy: 'Direto, com atitude. Usa pra punk, trap, rock pesado. Sem meias-palavras.',
} as const;
