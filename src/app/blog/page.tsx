import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogShell } from './_components/BlogPostShell';
import { POSTS } from './posts';

export const metadata: Metadata = {
  title: 'Blog Verelus — IA para PMEs brasileiras',
  description:
    'Artigos sobre atendimento automático, IA no WhatsApp, automação de PMEs e crescimento de negócio. Conteúdo prático para donos de negócios brasileiros.',
  openGraph: {
    title: 'Blog Verelus — IA para PMEs brasileiras',
    description: 'Conteúdo prático sobre IA, atendimento automático e crescimento de PMEs.',
    type: 'website',
    url: 'https://verelus.com/blog',
    siteName: 'Verelus',
    images: [
      {
        url: 'https://verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Blog Verelus',
      },
    ],
  },
  alternates: { canonical: 'https://verelus.com/blog' },
};

export default function BlogIndex() {
  const sortedPosts = [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <BlogShell>
      <header className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
          Blog Verelus
        </h1>
        <p className="text-lg text-brand-muted leading-relaxed">
          Conteúdo prático sobre IA, atendimento automático e crescimento de PMEs.
          Sem jargão, sem hype.
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <ul className="divide-y divide-brand-border">
          {sortedPosts.map((post) => {
            const formattedDate = new Date(post.publishedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            return (
              <li key={post.slug} className="py-8">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-brand-trust transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-brand-muted leading-relaxed mb-3">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-brand-muted">
                    <time dateTime={post.publishedAt}>{formattedDate}</time>
                    <span>·</span>
                    <span>{post.readingMinutes} min de leitura</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </BlogShell>
  );
}
