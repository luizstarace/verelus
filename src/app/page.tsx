import Link from 'next/link';
import TrialCtaButton from '@/components/TrialCtaButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-brand-primary tracking-tight">
          Verelus
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/atalaia"
            className="text-sm font-medium text-brand-muted hover:text-brand-trust transition-colors"
          >
            Atalaia
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold bg-brand-cta text-white rounded-lg hover:brightness-110 transition-all"
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-10 max-w-4xl mx-auto">
        <span className="inline-block px-4 py-1.5 bg-brand-trust/10 text-brand-trust text-xs font-semibold rounded-full mb-6">
          7 dias grátis · sem cartão
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Atendente IA 24/7 no WhatsApp,{' '}
          <span className="text-brand-trust">a partir de R$147/mês</span>
        </h1>
        <p className="text-lg text-brand-muted max-w-2xl leading-relaxed">
          Sua atendente IA responde no WhatsApp e no widget do seu site como se fosse você.
          Agenda, tira dúvidas e vende — mesmo de madrugada. Tudo via Atalaia.
        </p>
      </section>

      {/* Pricing — 3 mini-cards acima da fold */}
      <section className="px-6 pt-4 pb-16 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {/* Starter */}
          <div className="bg-white rounded-xl p-5 border border-brand-border hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold mb-1">Starter</h3>
            <div className="mb-2">
              <span className="text-2xl font-black">R$147</span>
              <span className="text-brand-muted text-xs">/mês</span>
            </div>
            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              500 mensagens/mês · Widget + WhatsApp
            </p>
            <TrialCtaButton
              source="home-pricing-starter"
              className="block text-center w-full px-4 py-2 text-sm font-semibold rounded-lg bg-brand-surface text-brand-text hover:bg-brand-border transition-all"
            >
              Testar 7 dias grátis
            </TrialCtaButton>
          </div>

          {/* Pro (destacado) */}
          <div className="relative bg-white rounded-xl p-5 border-2 border-brand-cta ring-1 ring-brand-cta shadow-md">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-cta text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
              Mais popular
            </span>
            <h3 className="text-base font-bold mb-1">Pro</h3>
            <div className="mb-2">
              <span className="text-2xl font-black">R$297</span>
              <span className="text-brand-muted text-xs">/mês</span>
            </div>
            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              2.500 mensagens · 30 min voz · Widget + WhatsApp
            </p>
            <TrialCtaButton
              source="home-pricing-pro"
              className="block text-center w-full px-4 py-2 text-sm font-semibold rounded-lg bg-brand-cta text-white hover:brightness-110 transition-all"
            >
              Testar 7 dias grátis
            </TrialCtaButton>
          </div>

          {/* Business */}
          <div className="bg-white rounded-xl p-5 border border-brand-border hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold mb-1">Business</h3>
            <div className="mb-2">
              <span className="text-2xl font-black">R$597</span>
              <span className="text-brand-muted text-xs">/mês</span>
            </div>
            <p className="text-xs text-brand-muted mb-4 leading-relaxed">
              10.000 mensagens · 120 min voz · Voz personalizada
            </p>
            <TrialCtaButton
              source="home-pricing-business"
              className="block text-center w-full px-4 py-2 text-sm font-semibold rounded-lg bg-brand-surface text-brand-text hover:bg-brand-border transition-all"
            >
              Testar 7 dias grátis
            </TrialCtaButton>
          </div>
        </div>

        <p className="text-center text-sm text-brand-muted">
          Pricing público, setup em 5 minutos, LGPD-first.{' '}
          <Link
            href="/atalaia"
            className="text-brand-trust font-medium hover:underline"
          >
            Ver detalhes da Atalaia →
          </Link>
        </p>
      </section>

      {/* JSON-LD SoftwareApplication for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Atalaia',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'Atendente de IA 24/7 no WhatsApp e no site para PMEs brasileiras. Agenda, tira dúvidas e vende automaticamente.',
            url: 'https://verelus.com/atalaia',
            offers: {
              '@type': 'Offer',
              price: '147.00',
              priceCurrency: 'BRL',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '147.00',
                priceCurrency: 'BRL',
                billingIncrement: 1,
                unitCode: 'MON',
              },
            },
            provider: {
              '@type': 'Organization',
              name: 'Verelus',
              url: 'https://verelus.com',
            },
          }),
        }}
      />

      {/* Footer */}
      <footer className="border-t border-brand-border mt-12">
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
