import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Attendly — Atendente IA 24/7 no WhatsApp e no seu site',
  description:
    'Responde clientes no WhatsApp e no seu site 24 horas por dia. Agenda, tira dúvidas e vende no piloto automático. Teste 7 dias grátis, sem cartão.',
  openGraph: {
    title: 'Attendly — Atendente IA 24/7 no WhatsApp e no seu site',
    description:
      'Atendente de IA para PMEs brasileiras. WhatsApp + widget no site, com voz natural. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/attendly',
    siteName: 'Attendly',
    images: [
      {
        url: 'https://verelus.com/og-attendly.png',
        width: 1200,
        height: 630,
        alt: 'Attendly — Atendente IA 24/7 no WhatsApp e no site',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attendly — Atendente IA 24/7',
    description:
      'Atendente de IA no WhatsApp e no seu site. 7 dias grátis, sem cartão.',
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: 'https://verelus.com/attendly' },
};

export default function AttendlyPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-brand-primary tracking-tight">
            Verelus
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-brand-trust border-b-2 border-brand-trust pb-0.5">
              Attendly
            </span>
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold bg-brand-cta text-white rounded-lg hover:brightness-110 transition-all shadow-sm"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-brand-bg py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-baseline gap-3 mb-8">
            <span className="text-8xl sm:text-9xl font-black text-brand-cta leading-none tracking-tighter">
              24/7
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6 max-w-3xl mx-auto">
            Seu negócio nunca mais perde cliente
            <br className="hidden sm:block" />
            <span className="text-brand-trust"> por falta de atendimento</span>
          </h1>
          <p className="text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed mb-10">
            Uma IA que responde no WhatsApp e no seu site como se fosse você.
            Agenda, tira dúvidas e vende — mesmo de madrugada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/login"
              className="px-8 py-4 bg-brand-cta text-white font-semibold rounded-xl text-lg hover:brightness-110 transition-all shadow-lg shadow-brand-cta/25"
            >
              Testar 7 dias grátis
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 font-semibold rounded-xl text-lg text-brand-primary border-2 border-brand-border hover:border-brand-trust hover:text-brand-trust transition-all"
            >
              Ver como funciona
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brand-muted">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Sem cartão
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Setup em 5 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Dados em conformidade com a LGPD
            </span>
          </div>
        </div>
      </section>

      {/* ── Tech-trust strip ── */}
      <section className="bg-white py-8 border-y border-brand-border">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-wider text-brand-muted mb-4 font-semibold">
            Construído com tecnologia de ponta
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-brand-muted">
            <span className="font-medium">Anthropic Claude</span>
            <span className="text-brand-border">·</span>
            <span className="font-medium">Stripe</span>
            <span className="text-brand-border">·</span>
            <span className="font-medium">Supabase</span>
            <span className="text-brand-border">·</span>
            <span className="font-medium">Cloudflare</span>
            <span className="text-brand-border">·</span>
            <span className="font-medium">ElevenLabs</span>
          </div>
        </div>
      </section>

      {/* ── Para quem e o Attendly ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Para quem é o Attendly</h2>
          <p className="text-brand-muted text-center mb-14 max-w-xl mx-auto">
            Se você atende clientes e perde mensagens fora do horário, o Attendly foi feito pra você.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { emoji: '\u{1F3E5}', title: 'Clínicas e consultórios', desc: 'Agendamento e confirmação automática de consultas' },
              { emoji: '\u{1F355}', title: 'Restaurantes e delivery', desc: 'Cardápio, pedidos e reservas sem espera' },
              { emoji: '\u{2702}\u{FE0F}', title: 'Salões e barbearias', desc: 'Horários disponíveis e marcação instantânea' },
              { emoji: '\u{1F6CD}\u{FE0F}', title: 'Lojas e e-commerce', desc: 'Dúvidas sobre produtos, estoque e entrega' },
              { emoji: '\u{1F4BC}', title: 'Serviços profissionais', desc: 'Orçamentos e qualificação de leads automática' },
              { emoji: '\u{1F3CB}\u{FE0F}', title: 'Academias e estúdios', desc: 'Planos, horários de aula e matrícula' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-5 rounded-xl border border-brand-border bg-brand-bg hover:border-brand-trust/40 hover:shadow-sm transition-all"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Atendente humano vs Attendly</h2>
          <p className="text-brand-muted text-center mb-14 max-w-xl mx-auto">
            Compare e veja por que tantos negócios estão migrando.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto">
              <thead>
                <tr className="border-b-2 border-brand-border">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-brand-muted w-1/3" />
                  <th className="px-5 py-4 text-sm font-semibold text-brand-muted w-1/3">Atendente humano</th>
                  <th className="px-5 py-4 text-sm font-semibold text-brand-trust w-1/3">Attendly</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Custo mensal', human: 'R$ 1.500–3.000', ai: 'A partir de R$ 147' },
                  { label: 'Disponibilidade', human: '8h/dia, seg–sex', ai: '24 horas, 7 dias' },
                  { label: 'Faltas e férias', human: 'Sim', ai: 'Nunca' },
                  { label: 'Conversas simultâneas', human: '1 por vez', ai: 'Ilimitadas' },
                  { label: 'Tempo de setup', human: 'Semanas de treinamento', ai: '5 minutos' },
                  { label: 'Escala com demanda', human: 'Precisa contratar mais', ai: 'Automático' },
                ].map((row, i) => (
                  <tr key={row.label} className={`border-b border-brand-border ${i % 2 === 0 ? 'bg-white' : 'bg-brand-surface/50'}`}>
                    <td className="px-5 py-4 text-sm font-medium">{row.label}</td>
                    <td className="px-5 py-4 text-sm text-center">
                      <span className="inline-flex items-center gap-1.5 text-brand-error/80">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {row.human}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-center">
                      <span className="inline-flex items-center gap-1.5 text-brand-success font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {row.ai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-brand-muted text-center mb-16 max-w-xl mx-auto">
            Três passos simples. Sem código, sem complicação.
          </p>
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              {
                num: '1',
                title: 'Cadastre seu negócio',
                desc: 'Preencha serviços, preços e horários. Leva 5 minutos.',
                icon: (
                  <svg className="w-7 h-7 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                ),
              },
              {
                num: '2',
                title: 'A IA aprende tudo',
                desc: 'Nosso modelo cria um atendente que fala como você.',
                icon: (
                  <svg className="w-7 h-7 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
              {
                num: '3',
                title: 'Clientes atendidos 24/7',
                desc: 'Widget no site + WhatsApp. Você só intervém quando quiser.',
                icon: (
                  <svg className="w-7 h-7 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-brand-trust/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  {step.icon}
                </div>
                <span className="inline-block text-xs font-bold text-brand-cta bg-brand-cta/10 px-3 py-1 rounded-full mb-3">
                  Passo {step.num}
                </span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-brand-bg py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14">Tudo que você precisa para atender melhor</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: 'WhatsApp + Widget no site',
                desc: 'Seus clientes falam onde preferem. Você gerencia tudo em um só lugar.',
                icon: (
                  <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                ),
              },
              {
                title: 'Voz natural (Pro+)',
                desc: 'Respostas em áudio com voz natural. Seus clientes vão estranhar de tão bom.',
                icon: (
                  <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                ),
              },
              {
                title: 'Transferência inteligente',
                desc: 'Se não sabe responder, avisa você na hora. Nenhum cliente fica sem resposta.',
                icon: (
                  <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
              },
              {
                title: 'Dashboard completo',
                desc: 'Veja todas as conversas, métricas e uso em tempo real. Controle total na palma da mão.',
                icon: (
                  <svg className="w-6 h-6 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex gap-5 p-6 rounded-xl border border-brand-border bg-white hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-trust/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Early access / valor ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-cta bg-brand-cta/10 px-3 py-1 rounded-full mb-4">
              Early access
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Entre agora e garanta o preço de lançamento
            </h2>
            <p className="text-brand-muted leading-relaxed">
              Os primeiros negócios cadastrados mantêm o valor de hoje mesmo se o preço subir depois.
              Você só paga após os 7 dias de teste — e só se quiser continuar.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-brand-bg rounded-xl p-6 border border-brand-border text-center">
              <div className="w-11 h-11 bg-brand-trust/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1">Resposta &lt; 2s</p>
              <p className="text-xs text-brand-muted">Resposta em streaming</p>
            </div>
            <div className="bg-brand-bg rounded-xl p-6 border border-brand-border text-center">
              <div className="w-11 h-11 bg-brand-trust/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1">Dados no Brasil</p>
              <p className="text-xs text-brand-muted">Criptografia e LGPD</p>
            </div>
            <div className="bg-brand-bg rounded-xl p-6 border border-brand-border text-center">
              <div className="w-11 h-11 bg-brand-trust/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1">Setup em 5 min</p>
              <p className="text-xs text-brand-muted">Zero código, zero configuração</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-brand-bg py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Planos simples, sem surpresas</h2>
          <p className="text-brand-muted text-center mb-14 max-w-xl mx-auto">
            Comece com 7 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border-2 border-brand-border hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-1">Starter</h3>
              <p className="text-sm text-brand-muted mb-5">Para quem está começando</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$147</span>
                <span className="text-brand-muted text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  500 mensagens/mês
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Widget + WhatsApp
                </li>
              </ul>
              <Link
                href="/login"
                className="block text-center w-full px-6 py-3 font-semibold rounded-lg bg-brand-surface text-brand-text hover:bg-brand-border transition-all"
              >
                Testar 7 dias grátis
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="relative bg-white rounded-2xl p-8 border-2 border-brand-cta ring-2 ring-brand-cta shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-cta text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                Mais popular
              </span>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-sm text-brand-muted mb-5">Para negócios em crescimento</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$297</span>
                <span className="text-brand-muted text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  2.500 mensagens/mês
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  30 min voz/mês
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Widget + WhatsApp
                </li>
              </ul>
              <Link
                href="/login"
                className="block text-center w-full px-6 py-3 font-semibold rounded-lg bg-brand-cta text-white hover:brightness-110 transition-all shadow-lg shadow-brand-cta/25"
              >
                Testar 7 dias grátis
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-2xl p-8 border-2 border-brand-border hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-1">Business</h3>
              <p className="text-sm text-brand-muted mb-5">Para operações de alto volume</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$597</span>
                <span className="text-brand-muted text-sm">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  10.000 mensagens/mês
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  120 min voz/mês
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Voz personalizada
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Widget + WhatsApp
                </li>
              </ul>
              <Link
                href="/login"
                className="block text-center w-full px-6 py-3 font-semibold rounded-lg bg-brand-surface text-brand-text hover:bg-brand-border transition-all"
              >
                Testar 7 dias grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14">Perguntas frequentes</h2>
          <div className="max-w-2xl mx-auto divide-y divide-brand-border">
            {[
              { q: 'Preciso saber programar?', a: 'Não. Zero código. Você preenche um formulário simples com informações do seu negócio, e a IA faz o resto. Leva menos de 5 minutos.' },
              { q: 'Quanto tempo leva pra configurar?', a: 'Em média 5 minutos. Você cadastra seus serviços, preços e horários, e o atendente já está pronto pra funcionar.' },
              { q: 'E se o atendente errar?', a: 'Você acompanha todas as conversas no dashboard e pode corrigir a qualquer momento. A IA aprende com cada ajuste.' },
              { q: 'Meus dados estão seguros?', a: 'Sim. Usamos criptografia ponta a ponta e estamos em total conformidade com a LGPD. Seus dados e os dos seus clientes estão protegidos.' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim, 2 cliques no painel. Sem multa, sem burocracia, sem período de fidelidade.' },
              { q: 'Funciona com WhatsApp?', a: 'Sim. O Attendly funciona tanto no WhatsApp quanto via widget no seu site. Seus clientes escolhem onde preferem falar.' },
              { q: 'O atendente responde em outros idiomas?', a: 'Sim. A IA detecta o idioma do cliente e responde automaticamente. Ideal se você recebe turistas ou clientes internacionais.' },
            ].map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between py-5 cursor-pointer text-left font-medium hover:text-brand-trust transition-colors">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-brand-muted flex-shrink-0 ml-4 group-open:rotate-180 transition-transform duration-200"
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

      {/* ── Final CTA ── */}
      <section className="bg-brand-primary py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 max-w-3xl mx-auto leading-snug">
            Enquanto você lê isso, seu concorrente está atendendo clientes às 3 da manhã.
          </h2>
          <Link
            href="/login"
            className="inline-block px-10 py-4 bg-brand-cta text-white font-semibold rounded-xl text-lg hover:brightness-110 transition-all shadow-lg shadow-black/20 mb-5"
          >
            Começar agora — 7 dias grátis
          </Link>
          <p className="text-sm text-white/70">
            7 dias grátis. Sem cartão. Sem compromisso.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
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
