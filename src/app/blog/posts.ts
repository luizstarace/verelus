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
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return POSTS.find((p) => p.slug === slug);
}
