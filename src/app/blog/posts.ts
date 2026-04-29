import type { BlogPostMeta } from './_components/BlogPostShell';

// Manifest of all published blog posts. Update here when adding a new post.
// The blog index page reads this; sitemap.ts reads this; each post page
// imports its own meta from here too (single source of truth).

export const POSTS: BlogPostMeta[] = [
  {
    slug: 'atendente-virtual-whatsapp-pme-como-funciona',
    title: 'Atendente virtual WhatsApp para PMEs: como funciona, quanto custa, vale a pena?',
    description:
      'Guia completo sobre atendente virtual de WhatsApp para pequenas e médias empresas: o que é, como funciona, diferença para chatbot, custo real e quando vale a pena adotar.',
    publishedAt: '2026-04-28',
    keywords: ['atendente virtual whatsapp', 'chatbot pme', 'atendimento automático whatsapp', 'ia whatsapp pequena empresa'],
    readingMinutes: 9,
  },
  {
    slug: '5-sinais-pme-perdendo-cliente-atendimento',
    title: '5 sinais de que sua PME está perdendo cliente no atendimento',
    description:
      'Cinco sinais práticos que mostram que seu negócio está perdendo clientes por falhas de atendimento — e o que fazer pra resolver cada um sem contratar mais gente.',
    publishedAt: '2026-04-28',
    keywords: ['perder cliente atendimento', 'pme atendimento whatsapp', 'tempo resposta atendimento', 'atendimento ao cliente pme'],
    readingMinutes: 5,
  },
  {
    slug: 'como-configurar-atendimento-automatico-whatsapp-5-passos',
    title: 'Como configurar atendimento automático no WhatsApp em 5 passos',
    description:
      'Tutorial prático: 5 passos para configurar um atendente automático no WhatsApp do seu negócio, do mapeamento de FAQs até o teste antes de ir ao ar.',
    publishedAt: '2026-04-29',
    keywords: ['atendimento automatico whatsapp', 'configurar chatbot whatsapp', 'automatizar whatsapp business', 'como criar atendente virtual'],
    readingMinutes: 7,
  },
  {
    slug: 'chatbot-gratis-vs-pago-pme-brasileira',
    title: 'Chatbot grátis vs pago: qual vale a pena para a PME brasileira?',
    description:
      'Análise honesta das opções de chatbot grátis e pago para pequenas empresas no Brasil. Quando o grátis basta, quando o pago paga sozinho, e como decidir.',
    publishedAt: '2026-04-29',
    keywords: ['chatbot gratis pme', 'chatbot pago whatsapp', 'comparativo chatbot brasil', 'chatbot pequena empresa'],
    readingMinutes: 6,
  },
  {
    slug: 'whatsapp-business-vs-ia-salao-de-beleza',
    title: 'WhatsApp Business vs IA: qual usar no seu salão de beleza',
    description:
      'Comparativo prático entre o WhatsApp Business e um atendente de IA para salão de beleza ou barbearia. Onde cada um resolve, onde trava, e qual escolher pra cada estágio.',
    publishedAt: '2026-04-29',
    keywords: ['whatsapp business salao', 'atendente whatsapp salao de beleza', 'automatizar salao whatsapp', 'agendamento whatsapp barbearia'],
    readingMinutes: 6,
  },
  {
    slug: 'reduzir-mensagens-nao-respondidas-whatsapp-com-ia',
    title: 'Como reduzir 80% das mensagens não respondidas usando IA',
    description:
      'Quatro estratégias práticas para acabar com mensagens não respondidas no WhatsApp do negócio usando IA. Como medir baseline, o que esperar e em quanto tempo.',
    publishedAt: '2026-04-29',
    keywords: ['responder whatsapp automaticamente', 'mensagens nao respondidas whatsapp', 'reduzir tempo resposta', 'automatizar resposta whatsapp'],
    readingMinutes: 7,
  },
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}
