import Link from 'next/link';
import type { ReactNode } from 'react';

// Shared shell for blog index + each post page. Includes nav/footer (consistent
// with /attendly) and a typography-styled article container.

const SITE_BASE = 'https://verelus.com';

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;       // ISO yyyy-mm-dd
  updatedAt?: string;
  keywords: string[];
  readingMinutes: number;
};

export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-brand-primary tracking-tight">
            Verelus
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/attendly"
              className="text-sm font-medium text-brand-muted hover:text-brand-trust transition-colors"
            >
              Attendly
            </Link>
            <Link
              href="/blog"
              className="text-sm font-semibold text-brand-trust border-b-2 border-brand-trust pb-0.5"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold bg-brand-cta text-white rounded-lg hover:brightness-110 transition-all shadow-sm"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="bg-white border-t border-brand-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-muted">
            &copy; {new Date().getFullYear()} Verelus. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
              Privacidade
            </Link>
            <Link href="/terms" className="text-sm text-brand-muted hover:text-brand-text transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function BlogPostShell({ meta, children }: { meta: BlogPostMeta; children: ReactNode }) {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt || meta.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Verelus',
      url: SITE_BASE,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Verelus',
      url: SITE_BASE,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_BASE}/blog/${meta.slug}`,
    },
    keywords: meta.keywords.join(', '),
    image: `${SITE_BASE}/og-attendly.png`,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Verelus', item: SITE_BASE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_BASE}/blog` },
      { '@type': 'ListItem', position: 3, name: meta.title, item: `${SITE_BASE}/blog/${meta.slug}` },
    ],
  };

  const formattedDate = new Date(meta.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-10">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-brand-muted hover:text-brand-trust transition-colors mb-6"
          >
            ← Voltar para o blog
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
            {meta.title}
          </h1>
          <p className="text-lg text-brand-muted leading-relaxed mb-5">{meta.description}</p>
          <div className="flex items-center gap-3 text-sm text-brand-muted">
            <time dateTime={meta.publishedAt}>{formattedDate}</time>
            <span>·</span>
            <span>{meta.readingMinutes} min de leitura</span>
          </div>
        </header>

        <div className="prose-content text-brand-text leading-relaxed">
          {children}
        </div>

        {/* CTA at end of every post */}
        <div className="mt-16 p-8 bg-brand-surface border border-brand-border rounded-2xl text-center">
          <h2 className="text-xl font-bold mb-2">Quer testar o Attendly?</h2>
          <p className="text-brand-muted mb-5">
            7 dias grátis sem cartão. Setup em 5 minutos.
          </p>
          <Link
            href="/attendly"
            className="inline-block px-8 py-3 bg-brand-cta text-white font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            Conhecer o Attendly
          </Link>
        </div>
      </article>
    </BlogShell>
  );
}
