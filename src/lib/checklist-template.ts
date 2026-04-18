import type { ChecklistItem, ChecklistInput, ReleaseType } from '@/lib/types/tools';

/**
 * Template base de checklist de lancamento.
 * Curado com base em padroes de A&R / management indie BR.
 *
 * Filosofia:
 * - D-56 (8 semanas antes): producao final + registro de direitos
 * - D-28 (4 semanas): distribuidor + teaser strategy + press outreach inicial
 * - D-14 (2 semanas): pre-save + final press outreach
 * - D-7 (1 semana): countdown + ultimos ajustes
 * - D-0 (lancamento): coordenacao multi-plataforma
 * - D+14: analytics + retro + planejamento proximo
 */

const TEMPLATE: ChecklistItem[] = [
  // ===== D-56 (8 semanas antes) — FUNDAMENTOS =====
  {
    id: 't56-master',
    title: 'Finalizar masterização da(s) música(s)',
    description: 'Envie pra um mastering engineer ou use um serviço online tipo LANDR. Receba os arquivos em WAV 24bit 44.1kHz. Sem masterização decente, playlists editoriais nem consideram.',
    due_offset_days: -56,
    phase: 'D-56',
    category: 'production',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't56-artwork',
    title: 'Finalizar artwork (capa) em alta resolução',
    description: 'Mínimo 3000x3000px JPG/PNG. Cuide dos direitos da imagem — se usou foto de alguém, precisa ter autorização escrita. Capa é a primeira coisa que o fã vê; vale investir.',
    due_offset_days: -56,
    phase: 'D-56',
    category: 'production',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't56-metadata',
    title: 'Preparar metadata completa',
    description: 'Título, compositores, produtores, letra, ISRC (se já tem), gênero primário e secundário. Essa info vai pro distribuidor.',
    due_offset_days: -56,
    phase: 'D-56',
    category: 'distribution',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't56-ecad',
    title: 'Registrar obra no ECAD',
    description: 'Essencial pra receber direitos autorais de execução pública. Sem esse registro você perde dinheiro de rádio, bares, shows. Gratuito.',
    due_offset_days: -56,
    phase: 'D-56',
    category: 'rights',
    link_url: 'https://www.ecad.org.br/',
    link_label: 'Portal ECAD',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't56-producao-audiovisual',
    title: 'Iniciar produção de vídeo/clipe (se houver)',
    description: 'Se planeja clipe oficial, começar agora. Vídeo demora mais que áudio pra ficar pronto.',
    due_offset_days: -56,
    phase: 'D-56',
    category: 'production',
    applicable_for: { release_types: ['single', 'ep', 'album'], budgets: ['medio', 'pro'] },
  },

  // ===== D-28 (4 semanas antes) =====
  {
    id: 't28-distribuidor',
    title: 'Submeter ao distribuidor (DistroKid / TuneCore / Onerpm)',
    description: 'Pra lançar na data X, submeter no mínimo 21 dias antes (recomendado 4 semanas). Isso garante pitch pro Spotify editorial via Spotify for Artists e evita atrasos na data de release.',
    due_offset_days: -28,
    phase: 'D-28',
    category: 'distribution',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't28-pitch-spotify',
    title: 'Pitch pra playlist editorial do Spotify',
    description: 'Use o Spotify for Artists -> Pitching. Submeta pelo menos 21 dias antes do lançamento. Escreva pitch específico sobre o que a música tem de único — use o Pitch Kit do Verelus pra gerar texto profissional.',
    due_offset_days: -28,
    phase: 'D-28',
    category: 'distribution',
    link_url: 'https://artists.spotify.com',
    link_label: 'Spotify for Artists',
    importance: 'critical',
    link_tool: 'pitch-kit',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't28-pre-save',
    title: 'Criar link de pre-save (Linkfire / Feature.fm / show.co)',
    description: 'Pre-save antecipado conta como stream na primeira semana. Essencial pra chart e pra o algoritmo do Spotify identificar momentum. Sem pre-save você desperdiça 4 semanas de hype.',
    due_offset_days: -28,
    phase: 'D-28',
    category: 'marketing',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't28-teaser-concept',
    title: 'Planejar estratégia de teaser (4-5 posts até o release)',
    description: 'Planeje 30 dias de posts coordenados antes do lançamento. Use o Cronograma de Posts do Verelus pra gerar ideias, captions e datas já prontas.',
    due_offset_days: -28,
    phase: 'D-28',
    category: 'marketing',
    importance: 'important',
    link_tool: 'content-calendar',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't28-press-list',
    title: 'Montar lista de imprensa/blogs/curadores',
    description: 'Identifique 10-20 veículos/curadores relevantes pro seu gênero. Anote email/forma de contato e tom específico de cada um. Lista mal montada = pitches genéricos ignorados.',
    due_offset_days: -28,
    phase: 'D-28',
    category: 'press',
    importance: 'important',
    applicable_for: { release_types: ['single', 'ep', 'album'], objectives: ['discovery', 'radio'] },
  },

  // ===== D-14 (2 semanas antes) =====
  {
    id: 't14-pitch-enviar',
    title: 'Enviar pitch pra curadores e imprensa',
    description: 'Playlists editoriais e jornalistas precisam receber pitch no mínimo 2 semanas antes da release. Use o Pitch Kit pra gerar email + 1-pager profissional. Envie com link de pre-save + preview privado da música.',
    due_offset_days: -14,
    phase: 'D-14',
    category: 'press',
    importance: 'critical',
    link_tool: 'pitch-kit',
    applicable_for: { release_types: ['single', 'ep', 'album'], objectives: ['discovery', 'radio'] },
  },
  {
    id: 't14-pitch-playlists-independentes',
    title: 'Submeter a playlists de curadores independentes (SubmitHub / Groover)',
    description: 'Playlists independentes aceitam submissões pagas. Calcule orçamento: R$15-30 por submissão no SubmitHub, 1-2 créditos Groover por curador.',
    due_offset_days: -14,
    phase: 'D-14',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'], objectives: ['discovery'], budgets: ['medio', 'pro'] },
  },
  {
    id: 't14-confirmar-distribuidor',
    title: 'Confirmar que o release esta "pending" e sem erros no distribuidor',
    description: 'Checa o painel. Se há erro de metadata (ex: gênero inválido, título duplicado), resolve antes dos 7 dias críticos.',
    due_offset_days: -14,
    phase: 'D-14',
    category: 'distribution',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't14-primeiro-teaser',
    title: 'Postar primeiro teaser (conceitual)',
    description: 'Revelar o mood/clima da música. Não mostre o áudio ainda — gere curiosidade. Story + reel. Veja o Cronograma de Posts pra ideias de caption e formato.',
    due_offset_days: -14,
    phase: 'D-14',
    category: 'marketing',
    importance: 'important',
    link_tool: 'content-calendar',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },

  // ===== D-7 (1 semana antes) =====
  {
    id: 't7-second-teaser',
    title: 'Postar teaser com trecho da música (15-30s)',
    description: 'Primeira vez que o público ouve algo. Reel no IG, vídeo vertical no TikTok, YouTube Shorts. Legenda com data do release.',
    due_offset_days: -7,
    phase: 'D-7',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't7-countdown',
    title: 'Ativar countdown no Instagram Stories',
    description: 'Sticker de countdown. Fácil, gera lembrete automático em quem se inscreve. Anuncie a data firme — a primeira semana depende desse hype concentrado.',
    due_offset_days: -7,
    phase: 'D-7',
    category: 'marketing',
    importance: 'important',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't7-release-party',
    title: 'Planejar show/live ou listening party (opcional)',
    description: 'Evento na data do release ou na semana. Pode ser show físico, live no Instagram, ou listening party online. Cria ritual + conteúdo. Se for show físico, gere rider e contrato antes.',
    due_offset_days: -7,
    phase: 'D-7',
    category: 'live',
    importance: 'optional',
    link_tool: 'rider',
    applicable_for: { release_types: ['ep', 'album'], budgets: ['medio', 'pro'] },
  },
  {
    id: 't7-revalidar-links',
    title: 'Testar todos os links do pre-save e verificar funcionamento',
    description: 'Clica em cada link como se fosse um fã. Funciona pro Spotify? Pra Apple? Link do 1-pager abre? Resolve qualquer problema antes — link quebrado no dia do release desperdiça todo o hype.',
    due_offset_days: -7,
    phase: 'D-7',
    category: 'distribution',
    importance: 'critical',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },

  // ===== D-0 (dia do lancamento) =====
  {
    id: 't0-post-launch',
    title: 'Postar anúncio do release em todas as plataformas (8-10h)',
    description: 'Coordenado: Reel IG, vídeo TikTok, tweet, story. Cada um adaptado pra plataforma. Sua bio deve estar atualizada em todo lugar antes disso — use a Bio Adaptativa pra ter as 4 versões otimizadas prontas.',
    due_offset_days: 0,
    phase: 'D-0',
    category: 'marketing',
    importance: 'critical',
    link_tool: 'bio',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't0-stories-fas',
    title: 'Compartilhar posts de fas que escutaram (ao longo do dia)',
    description: 'Quem posta sobre sua música, repostar nos seus stories. Cria efeito social + reciprocidade.',
    due_offset_days: 0,
    phase: 'D-0',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't0-pitch-now-playing',
    title: 'Enviar música pra playlists menores (em tempo real)',
    description: 'Curadores de playlists pequenas frequentemente aceitam pitches no dia. Mande 5-10 DMs diretas pra contas ativas.',
    due_offset_days: 0,
    phase: 'D-0',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'], objectives: ['discovery'] },
  },
  {
    id: 't0-live-reaction',
    title: 'Fazer live no Instagram comemorando',
    description: '10-15 minutos, informal. Responder perguntas, tocar trecho ao vivo, agradecer apoio. Não precisa ser produzido.',
    due_offset_days: 0,
    phase: 'D-0',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't0-enviar-lista',
    title: 'Enviar email/newsletter pra lista de fãs',
    description: 'Se você tem mailing list, dispara anúncio. Taxa de abertura de email tende a ser muito maior que alcance orgânico de social.',
    due_offset_days: 0,
    phase: 'D-0',
    category: 'marketing',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },

  // ===== D+14 (2 semanas depois) =====
  {
    id: 't14p-analise-spotify',
    title: 'Analisar performance no Spotify for Artists',
    description: 'Quantos ouvintes novos? De onde vieram? Quais playlists tracionaram? Identifica padrões pra próximo release.',
    due_offset_days: 14,
    phase: 'D+14',
    category: 'analytics',
    link_url: 'https://artists.spotify.com',
    link_label: 'Spotify for Artists',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't14p-realimentar-playlists',
    title: 'Re-engajar com curadores que colocaram a música',
    description: 'Agradecer curadores com personal touch. Essa relação vale pros próximos releases. Não seja só transacional — use o Pitch Kit pra montar um follow-up com tom pessoal.',
    due_offset_days: 14,
    phase: 'D+14',
    category: 'press',
    importance: 'important',
    link_tool: 'pitch-kit',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't14p-retro',
    title: 'Fazer retrospectiva do lancamento',
    description: 'Anote: o que deu certo? O que não funcionou? Quais canais tiveram melhor ROI? Usa isso no próximo release.',
    due_offset_days: 14,
    phase: 'D+14',
    category: 'analytics',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
  {
    id: 't14p-planejar-proximo',
    title: 'Definir concept do próximo release',
    description: 'O melhor momento pra planejar o próximo é logo após um. Momentum > pausa. Define concept, datas, produção.',
    due_offset_days: 14,
    phase: 'D+14',
    category: 'production',
    applicable_for: { release_types: ['single', 'ep', 'album'] },
  },
];

/**
 * Filtra itens aplicaveis ao input do user.
 * Template nao cobre 100% dos casos; user pode adicionar custom depois.
 */
export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  return TEMPLATE.filter((item) => {
    // Release type
    if (!item.applicable_for.release_types.includes(input.release_type)) return false;
    // Objetivo
    if (item.applicable_for.objectives && !item.applicable_for.objectives.includes(input.objective)) return false;
    // Budget
    if (item.applicable_for.budgets && !item.applicable_for.budgets.includes(input.budget)) return false;
    return true;
  });
}

/**
 * Calcula data absoluta de cada item a partir da release_date.
 */
export function calculateItemDueDate(release_date: string, offset_days: number): string {
  const date = new Date(release_date + 'T12:00:00');
  date.setDate(date.getDate() + offset_days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const PHASE_META: Record<ChecklistItem['phase'], { label: string; description: string }> = {
  'D-56': { label: '8 semanas antes', description: 'Fundamentos: produção, artwork, registros' },
  'D-28': { label: '4 semanas antes', description: 'Distribuidor e estratégia de teaser' },
  'D-14': { label: '2 semanas antes', description: 'Pitches e primeiro teaser público' },
  'D-7': { label: '1 semana antes', description: 'Countdown e ajustes finais' },
  'D-0': { label: 'Dia do lançamento', description: 'Coordenação multi-plataforma' },
  'D+14': { label: '2 semanas depois', description: 'Análise e planejamento próximo' },
};

export const CATEGORY_META: Record<ChecklistItem['category'], { label: string; color: string }> = {
  production: { label: 'Produção', color: 'purple' },
  distribution: { label: 'Distribuição', color: 'blue' },
  rights: { label: 'Direitos', color: 'yellow' },
  marketing: { label: 'Marketing', color: 'green' },
  press: { label: 'Imprensa', color: 'orange' },
  live: { label: 'Ao vivo', color: 'red' },
  analytics: { label: 'Analytics', color: 'pink' },
};

void buildChecklist;  // evitar unused warning se exported mas nao usado em um arquivo
