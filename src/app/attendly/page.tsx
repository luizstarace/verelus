import Link from 'next/link';

const comparisonRows = [
  { label: 'Custo', human: 'R$ 1.500-3.000/mês', ai: 'A partir de R$ 147/mês' },
  { label: 'Horário', human: '8h por dia', ai: '24/7/365' },
  { label: 'Faltas', human: 'Férias, faltas', ai: 'Nunca falta' },
  { label: 'Conversas simultâneas', human: '1 conversa por vez', ai: 'Ilimitadas' },
  { label: 'Setup', human: 'Treinamento longo', ai: 'Pronto em minutos' },
];

const steps = [
  {
    num: '1',
    title: 'Conte sobre seu negócio',
    desc: 'Preencha um formulário simples com seus serviços, preços e horários.',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    num: '2',
    title: 'IA aprende em minutos',
    desc: 'Nossa IA estuda seu negócio e cria um atendente personalizado.',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    num: '3',
    title: 'Clientes atendidos',
    desc: 'Seu atendente começa a responder no WhatsApp e no seu site.',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const features = [
  {
    title: 'WhatsApp + Site',
    desc: 'Onde seus clientes já estão',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    title: 'Responde com voz',
    desc: 'Áudio natural, não robô',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Transfere pra você',
    desc: 'Quando precisa do toque humano, você recebe notificação e assume',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
  },
  {
    title: 'Aprende com o tempo',
    desc: 'Cada conversa melhora o atendente',
    icon: (
      <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

const plans = [
  {
    name: 'Starter',
    price: '147',
    messages: '500 mensagens/mês',
    channels: 'Widget + WhatsApp',
    voice: null,
    clone: null,
    badge: null,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '297',
    messages: '2.500 mensagens/mês',
    channels: 'Widget + WhatsApp',
    voice: '30 min voz/mês',
    clone: null,
    badge: 'Mais popular',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '597',
    messages: '10.000 mensagens/mês',
    channels: 'Widget + WhatsApp',
    voice: '120 min voz/mês',
    clone: 'Voz personalizada',
    badge: null,
    highlighted: false,
  },
];

const faqs = [
  { q: 'Preciso saber programar?', a: 'Não, zero código. Você preenche um formulário e a IA faz o resto.' },
  { q: 'E se o atendente errar?', a: 'Você vê tudo no dashboard e pode corrigir. Ele aprende.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, 2 cliques, sem multa, sem burocracia.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia ponta a ponta, conformidade com LGPD.' },
];

export default function AttendlyPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-brand-primary tracking-tight">
          Verelus
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-brand-trust">Attendly</span>
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-semibold bg-brand-cta text-white rounded-lg hover:brightness-110 transition-all"
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Seu negócio atendendo{' '}
            <span className="text-brand-trust">clientes 24/7</span>
          </h1>
          <p className="text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed mb-8">
            IA que responde no WhatsApp e no seu site como se fosse você. Sem robô, sem espera.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-brand-cta text-white font-semibold rounded-lg text-lg hover:brightness-110 transition-all"
          >
            Testar 7 dias grátis
          </Link>
          <p className="text-sm text-brand-muted mt-4">Sem cartão de crédito</p>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Por que Attendly?</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-brand-surface">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-brand-muted" />
                  <th className="px-6 py-4 text-sm font-semibold text-brand-muted">Atendente humano</th>
                  <th className="px-6 py-4 text-sm font-semibold text-brand-trust">Attendly</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-surface/50'}>
                    <td className="px-6 py-4 text-sm font-medium">{row.label}</td>
                    <td className="px-6 py-4 text-sm text-center text-brand-muted">{row.human}</td>
                    <td className="px-6 py-4 text-sm text-center text-brand-success font-medium">{row.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 bg-brand-trust/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <span className="inline-block text-xs font-bold text-brand-trust bg-brand-trust/10 px-3 py-1 rounded-full mb-3">
                  Passo {step.num}
                </span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-brand-bg border border-brand-border rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-trust/10 rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Planos</h2>
          <p className="text-brand-muted text-center mb-12">Comece com 7 dias grátis em qualquer plano.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-shadow ${
                  plan.highlighted
                    ? 'border-brand-cta shadow-lg'
                    : 'border-brand-border hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-cta text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R${plan.price}</span>
                  <span className="text-brand-muted text-sm">/mês</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.messages}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.channels}
                  </li>
                  {plan.voice && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.voice}
                    </li>
                  )}
                  {plan.clone && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.clone}
                    </li>
                  )}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center w-full px-6 py-3 font-semibold rounded-lg transition-all ${
                    plan.highlighted
                      ? 'bg-brand-cta text-white hover:brightness-110'
                      : 'bg-brand-surface text-brand-text hover:bg-brand-border'
                  }`}
                >
                  Testar 7 dias grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="max-w-2xl mx-auto">
            {faqs.map((faq) => (
              <details key={faq.q} className="border-b border-brand-border group">
                <summary className="flex items-center justify-between py-5 cursor-pointer text-left font-medium hover:text-brand-trust transition-colors">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-brand-muted flex-shrink-0 ml-4 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="pb-5 text-sm text-brand-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Seu concorrente já está atendendo 24/7.{' '}
            <span className="text-brand-trust">E você?</span>
          </h2>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-brand-cta text-white font-semibold rounded-lg text-lg hover:brightness-110 transition-all"
          >
            Começar agora — 7 dias grátis
          </Link>
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
