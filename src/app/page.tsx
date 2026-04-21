import Link from 'next/link';

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
            href="/attendly"
            className="text-sm font-medium text-brand-muted hover:text-brand-trust transition-colors"
          >
            Attendly
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
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <span className="inline-block px-4 py-1.5 bg-brand-trust/10 text-brand-trust text-xs font-semibold rounded-full mb-6">
          Plataforma multi-produto com IA
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Produtos com IA que trabalham{' '}
          <span className="text-brand-trust">enquanto você descansa</span>
        </h1>
        <p className="text-lg text-brand-muted max-w-2xl leading-relaxed">
          A Verelus cria ferramentas inteligentes para pequenas e médias empresas.
          Cada produto resolve um problema real do dia a dia com inteligência artificial.
        </p>
      </section>

      {/* Products */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Nossos Produtos
        </h2>

        <div className="max-w-lg mx-auto">
          {/* Attendly Card */}
          <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-brand-trust/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-brand-trust"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Attendly</h3>
                <p className="text-sm text-brand-muted">Atendente IA 24/7 para PMEs</p>
              </div>
            </div>
            <p className="text-brand-muted leading-relaxed mb-6">
              IA que responde seus clientes no WhatsApp e no seu site como se fosse você.
              Sem robô, sem espera. Seu negócio atendendo 24 horas por dia, 7 dias por semana.
            </p>
            <Link
              href="/attendly"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cta text-white font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              Conhecer o Attendly
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-10">
          <span className="inline-block px-4 py-1.5 bg-brand-cta/10 text-brand-cta text-xs font-semibold rounded-full mb-4">
            Em breve
          </span>
          <h2 className="text-2xl font-bold mb-3">Novos produtos a caminho</h2>
          <p className="text-brand-muted max-w-xl mx-auto leading-relaxed">
            Estamos desenvolvendo novas ferramentas com IA para ajudar PMEs a vender mais,
            organizar melhor e crescer com menos esforço. Fique de olho.
          </p>
        </div>
      </section>

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
