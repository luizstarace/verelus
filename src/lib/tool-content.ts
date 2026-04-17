// src/lib/tool-content.ts

export const HELP_TEXTS = {
  cache: 'Cache (cachê) e o valor garantido que o venue/contratante paga pro artista, independente de bilheteria. Cobre o trabalho e as despesas da apresentacao.',
  breakEven: 'Break-even e o ponto onde a receita iguala as despesas. Abaixo desse valor voce esta pagando pra tocar. Acima, entra lucro.',
  exclusivity: 'Clausula de exclusividade impede o artista de tocar as mesmas musicas em venues concorrentes num raio/periodo especifico. Usada em festivais exclusivos e shows especiais.',
  cancellation: 'Multa por cancelamento protege o artista se o venue cancelar o show. Tipicamente 50% do cache se cancelado com menos de 30 dias.',
  recordingRights: 'Define se o venue/contratante pode gravar/transmitir o show. Inclui audio, video, livestream, clipes pra TikTok/Instagram.',
  pitchCurator: 'Curador de playlist: foca em "encaixe" (mood, energia, genero). Pitch deve enfatizar streams recentes, crescimento, e qual playlist sua faixa se encaixa.',
  pitchJournalist: 'Jornalista: foca em "historia" (contexto, angulo, timing). Pitch deve enfatizar narrativa unica, conexao com tendencia atual, e quote acionavel.',
  pitchRadio: 'Radio/DJ: foca em "espaco no programa" (duracao, estrutura, limpo vs explicito). Pitch curto e direto, menciona duracao, disponibilidade de versao radio edit.',
  monthlyListeners: 'Ouvintes mensais unicos no Spotify (nao e igual a streams). E o indicador mais importante de alcance real — streams podem ser inflados por poucos fans.',
  playlistFit: 'Playlist fit: quanto sua musica "encaixa" no mood/energia/tempo da playlist. Editores analisam os 30 segundos iniciais — gancho e essencial.',
} as const;

export type HelpTextKey = keyof typeof HELP_TEXTS;

export const CACHE_PRESETS = [
  {
    label: 'Solo acustico',
    description: 'Voz + violao ou piano, sem banda',
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
    description: '2 musicos, equipamento minimo',
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
    label: 'Producao full',
    description: '6+ musicos + tecnicos + logistica',
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
    emerging: '1-5k/mes em 6 meses (artista com <1k listeners hoje)',
    growing: '10-30k/mes em 6 meses (artista com 5-20k listeners hoje)',
    established: '50k-200k/mes em 6 meses (artista com 30k+ listeners hoje)',
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
    emerging: '1-5k em 3 meses (crescimento imprevisivel, depende de viral)',
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
    what: 'Define quando e como o pagamento e feito (sinal, dia do show, apos).',
    when: 'Sempre — e o ponto mais importante do contrato.',
    example: 'Padrao BR: 50% na assinatura, 50% no dia do show, ate 2h antes do soundcheck.',
  },
  cancellation: {
    what: 'Multa se o venue cancelar o show.',
    when: 'Todo contrato — protege seu trabalho investido em ensaios/logistica.',
    example: 'Cancelamento com menos de 30 dias: 50% do cache. Menos de 7 dias: 100%.',
  },
  recording: {
    what: 'Se o venue pode gravar/transmitir o show.',
    when: 'Festivais, venues com canal YouTube, qualquer casa que faca livestream.',
    example: 'Permito gravacao de audio pra uso interno. Video/livestream requer autorizacao previa escrita.',
  },
  exclusivity: {
    what: 'Impede tocar em venues concorrentes num raio/periodo.',
    when: 'Apenas pra festivais exclusivos ou shows especiais — evite em shows normais.',
    example: 'Nao tocar as mesmas musicas em venues num raio de 50km, 15 dias antes e depois.',
  },
  force_majeure: {
    what: 'Isenta as partes em caso de forca maior (pandemia, tempestade, guerra).',
    when: 'Sempre — e clausula padrao.',
  },
  rider_technical: {
    what: 'Lista os equipamentos/estrutura necessarios (PA, monitores, backline).',
    when: 'Qualquer show com banda ou equipamento especifico.',
    example: 'Ver rider tecnico anexo. PA minimo 2kW, 4 monitores, 8 canais de mesa.',
  },
};

export const RECIPIENT_PREVIEWS = {
  playlist_curator: {
    title: 'Pitch para curador de playlist',
    emphasis: [
      'Genero, mood e BPM (encaixe na playlist)',
      'Streams recentes e crescimento dos ultimos 30 dias',
      'Quais playlists similares voce esta',
      'Duracao do gancho (primeiros 15-30s)',
    ],
    avoid: 'Biografia longa. Eles escutam, nao leem.',
  },
  journalist: {
    title: 'Pitch para jornalista/imprensa',
    emphasis: [
      'Historia/angulo unico (por que AGORA?)',
      'Conexao com tendencia atual ou contexto',
      'Quote acionavel (algo citavel em 1 frase)',
      'Contexto do genero e cena',
    ],
    avoid: 'Release genericos ("lanca proximo single"). Precisa de angulo.',
  },
  radio: {
    title: 'Pitch para radio/DJ',
    emphasis: [
      'Duracao exata da faixa',
      'Versao radio-edit disponivel (se explicito)',
      'Estrutura (intro/verso/gancho)',
      'Data de disponibilidade',
    ],
    avoid: 'Historia longa. Va direto ao ponto.',
  },
  sync_licensing: {
    title: 'Pitch para licenciamento (sync)',
    emphasis: [
      'Mood, instrumentacao e energia',
      'Se ha versao instrumental disponivel',
      'Duracao e estrutura (beats de 15s, 30s)',
      'Status de publishing (auto-gerido vs editora)',
    ],
    avoid: 'Metricas de streaming (nao importam aqui).',
  },
} as const;

export type RecipientType = keyof typeof RECIPIENT_PREVIEWS;

export const PHASE_STRATEGY = {
  teaser: {
    title: 'Teaser (D-30 a D-22)',
    goal: 'Plantar curiosidade sem revelar muito. "Alguma coisa ta vindo."',
    tactics: 'Posts conceituais, bastidores crus, ambientacao visual. Evite audio.',
  },
  curiosity: {
    title: 'Construindo curiosidade (D-21 a D-14)',
    goal: 'Aprofundar interesse. Comecar a revelar pecas.',
    tactics: 'Bastidores do estudio, trechos de letra, processo criativo.',
  },
  preview: {
    title: 'Preview (D-13 a D-7)',
    goal: 'Revelar audio. Ativar pre-save.',
    tactics: 'Trechos de 15s, chamada explicita pra pre-save, contexto da faixa.',
  },
  countdown: {
    title: 'Countdown (D-6 a D-1)',
    goal: 'Gerar urgencia. Dia X.',
    tactics: 'Contagem regressiva, capa final, trechos maiores, stories diarios.',
  },
  launch: {
    title: 'Lancamento (D-0)',
    goal: 'Maximizar streams das primeiras 48h (algoritmos).',
    tactics: 'Anuncio coordenado em todas plataformas, thank you pros fans, link em todo lugar.',
  },
  post: {
    title: 'Pos-lancamento (D+1 a D+7)',
    goal: 'Manter momentum. Agradecer. Reagir.',
    tactics: 'Reacao aos comentarios, bastidores do lancamento, numeros alcancados, call pra playlists.',
  },
} as const;

export type PhaseKey = keyof typeof PHASE_STRATEGY;

export const TONE_DESCRIPTIONS = {
  formal: 'Profissional, editorial. Usa pra EPK, press releases, booking agents. Evita giria.',
  casual: 'Amigavel, proximo. Usa pra Instagram, dia-a-dia. Fala como se fosse um amigo.',
  poetico: 'Imagetico, metaforico. Usa pra artistas de MPB, folk, indie com peso literario.',
  edgy: 'Direto, com atitude. Usa pra punk, trap, rock pesado. Sem meias-palavras.',
} as const;
