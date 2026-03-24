"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type Lang = "pt" | "en";

// ═══════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════

const T = {
  pt: {
    nav: { features: "Recursos", pricing: "Preços", bandbrain: "BandBrain", faq: "FAQ", dashboard: "Acessar Dashboard" },
    hero: {
      badge: "Inteligência Musical com IA",
      h1a: "O Sinal Semanal",
      h1b: "Que Sua Banda Precisa",
      sub: "Tendências, oportunidades de sync, análises de mercado e insights acionáveis para músicos independentes — curados por IA, toda segunda-feira.",
      namePh: "Seu nome",
      emailPh: "Seu melhor email",
      cta: "Inscrever-se — É Grátis",
      sending: "Enviando...",
      ok: "✓ Inscrição realizada! Confira seu email.",
      err: "Erro ao inscrever. Tente novamente.",
      social: "Junte-se a músicos independentes do Brasil inteiro.",
    },
    features: {
      title: "O Que Você Recebe Toda Segunda",
      cards: [
        { icon: "🔥", title: "Top 3 Notícias", desc: "As histórias mais importantes da indústria musical da semana, resumidas e analisadas com IA." },
        { icon: "🎯", title: "Oportunidades de Sync", desc: "Dicas acionáveis de licenciamento sync — plataformas abertas, briefs e contatos." },
        { icon: "📊", title: "Tendência de Mercado", desc: "Insights baseados em dados: gêneros em alta, números de streaming e para onde a indústria está indo." },
        { icon: "🛠️", title: "Ferramenta da Semana", desc: "Uma ferramenta ou recurso curado para produção, distribuição ou marketing musical." },
        { icon: "🎶", title: "Playlist Curada por IA", desc: "Uma playlist editorial semanal baseada em tendências emergentes e artistas em ascensão." },
        { icon: "💡", title: "Dicas Pro", desc: "Estratégias diretas de artistas que estão crescendo no mercado independente." },
      ],
    },
    bandbrain: {
      badge: "PRODUTO LIVE",
      title: "BandBrain",
      subtitle: "Seu Gerente de Banda IA",
      desc: "Calendários de redes sociais, press releases, setlists, relatórios mensais e pitches para playlists — tudo gerado por IA, personalizado para sua banda. Já disponível.",
      pills: ["📅 Calendário Social", "📰 Press Release", "🎵 Estratégia de Setlist", "📊 Relatório Mensal", "✨ Kit de Pitch para Playlists"],
      demoLabel: "⚡ Exemplo de saída do BandBrain:",
      cta: "Começar Agora →",
    },
    pricing: {
      title: "Planos & Preços",
      subtitle: "Comece grátis. Evolua quando quiser.",
      tiers: [
        {
          name: "TuneSignal Newsletter",
          price: "Grátis",
          period: "pra sempre",
          features: ["Newsletter semanal (toda segunda)", "Top 3 notícias da indústria", "Tendências de mercado", "Recomendações de ferramentas", "Playlist curada por IA"],
          cta: "Inscrever-se Grátis",
          href: "#hero",
          style: "default" as const,
        },
        {
          name: "BandBrain Starter",
          price: "R$27",
          period: "/mês",
          features: ["Tudo da newsletter grátis", "3 Módulos IA: Calendário Social, Press Release, Playlist Pitch", "Exportar conteúdo em .md", "Histórico de gerações", "Suporte por email"],
          cta: "Começar com Starter",
          href: "https://pay.kiwify.com.br",
          style: "default" as const,
        },
        {
          name: "BandBrain Pro",
          price: "R$47",
          period: "/mês",
          badge: "POPULAR",
          features: ["Tudo do Starter", "5 Módulos IA (+Setlist, Relatório Mensal)", "Gerações ilimitadas", "Suporte prioritário", "Relatórios de performance"],
          cta: "Assinar Pro",
          href: "https://pay.kiwify.com.br",
          style: "featured" as const,
        },
      ],
    },
    faq: {
      title: "Perguntas Frequentes",
      items: [
        { q: "O que é TuneSignal?", a: "TuneSignal é seu newsletter musical semanal gratuito. Toda segunda-feira você recebe: top 3 notícias da semana, oportunidades de sync, tendências de mercado, recomendações de ferramentas e dicas estratégicas — tudo curado por IA." },
        { q: "O que é BandBrain?", a: "BandBrain é um gestor de carreira musical com IA. Ele gera conteúdo profissional para suas redes sociais, press releases, estratégia de setlist, relatórios mensais e pitches para playlists. É como ter um gerenciador de banda 24/7." },
        { q: "Posso cancelar a qualquer momento?", a: "Sim! O BandBrain tem política de reembolso de 7 dias via Kiwify. Você pode cancelar quando quiser, sem taxas escondidas." },
        { q: "Com quais gêneros funciona?", a: "Todos! Rock, indie, MPB, sertanejo, funk, trap, rap, eletrônico, samba, pop... A IA se adapta ao seu estilo e gênero automaticamente." },
        { q: "Como funciona a IA?", a: "Usamos Claude, uma das IAs mais avançadas do mercado. Ela aprende sobre sua banda, seu som e seu público para gerar conteúdo 100% personalizado e pronto para usar." },
        { q: "Preciso de conhecimento técnico?", a: "Não! Basta fazer login com seu email de assinatura. Escolha um módulo, descreva o contexto, e a IA gera tudo pra você." },
      ],
    },
    finalCta: {
      title: "Comece Sua Jornada Musical Hoje",
      desc: "Junte-se a músicos independentes brasileiros que estão evoluindo suas carreiras com TuneSignal e BandBrain.",
      cta: "Inscrever-se Grátis",
    },
    footer: {
      tagline: "Inteligência musical com IA para artistas independentes.",
      copy: "© 2026 TuneSignal. Todos os direitos reservados.",
    },
  },
  en: {
    nav: { features: "Features", pricing: "Pricing", bandbrain: "BandBrain", faq: "FAQ", dashboard: "Access Dashboard" },
    hero: {
      badge: "AI-Powered Music Intelligence",
      h1a: "The Weekly Signal",
      h1b: "Your Band Needs",
      sub: "Trends, sync opportunities, market analysis and actionable insights for independent musicians — AI-curated, every Monday.",
      namePh: "Your name",
      emailPh: "Your best email",
      cta: "Subscribe — It's Free",
      sending: "Sending...",
      ok: "✓ Subscribed! Check your email.",
      err: "Error subscribing. Try again.",
      social: "Join independent musicians from all over Brazil.",
    },
    features: {
      title: "What You Get Every Monday",
      cards: [
        { icon: "🔥", title: "Top 3 News", desc: "The most important music industry stories of the week, summarized and analyzed with AI." },
        { icon: "🎯", title: "Sync Opportunities", desc: "Actionable sync licensing tips — open platforms, briefs and contacts." },
        { icon: "📊", title: "Market Trends", desc: "Data-driven insights: trending genres, streaming numbers and where the industry is heading." },
        { icon: "🛠️", title: "Tool of the Week", desc: "A curated tool or resource for music production, distribution or marketing." },
        { icon: "🎶", title: "AI Curated Playlist", desc: "A weekly editorial playlist based on emerging trends and rising artists." },
        { icon: "💡", title: "Pro Tips", desc: "Direct strategies from artists growing in the independent market." },
      ],
    },
    bandbrain: {
      badge: "LIVE PRODUCT",
      title: "BandBrain",
      subtitle: "Your AI Band Manager",
      desc: "Social media calendars, press releases, setlists, monthly reports and playlist pitches — all AI-generated, personalized for your band. Available now.",
      pills: ["📅 Social Calendar", "📰 Press Release", "🎵 Setlist Strategy", "📊 Monthly Report", "✨ Playlist Pitch Kit"],
      demoLabel: "⚡ BandBrain output example:",
      cta: "Get Started Now →",
    },
    pricing: {
      title: "Plans & Pricing",
      subtitle: "Start free. Upgrade when ready.",
      tiers: [
        {
          name: "TuneSignal Newsletter",
          price: "Free",
          period: "forever",
          features: ["Weekly newsletter (every Monday)", "Top 3 industry news", "Market trends", "Tool recommendations", "AI curated playlist"],
          cta: "Subscribe Free",
          href: "#hero",
          style: "default" as const,
        },
        {
          name: "BandBrain Starter",
          price: "$7",
          period: "/mo",
          features: ["Everything in free newsletter", "3 AI Modules: Social Calendar, Press Release, Playlist Pitch", "Export content as .md", "Generation history", "Email support"],
          cta: "Start with Starter",
          href: "https://pay.kiwify.com.br",
          style: "default" as const,
        },
        {
          name: "BandBrain Pro",
          price: "$12",
          period: "/mo",
          badge: "POPULAR",
          features: ["Everything in Starter", "5 AI Modules (+Setlist, Monthly Report)", "Unlimited generations", "Priority support", "Performance reports"],
          cta: "Subscribe Pro",
          href: "https://pay.kiwify.com.br",
          style: "featured" as const,
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "What is TuneSignal?", a: "TuneSignal is your free weekly music newsletter. Every Monday: top 3 news, sync opportunities, market trends, tool recommendations and strategic tips — all AI-curated." },
        { q: "What is BandBrain?", a: "BandBrain is an AI-powered music career manager. It generates professional social media content, press releases, setlist strategies, monthly reports and playlist pitches. Like having a band manager 24/7." },
        { q: "Can I cancel anytime?", a: "Yes! BandBrain has a 7-day refund policy via Kiwify. You can cancel anytime, no hidden fees." },
        { q: "What genres does it work with?", a: "All of them! Rock, indie, MPB, sertanejo, funk, trap, rap, electronic, samba, pop... The AI adapts to your style automatically." },
        { q: "How does the AI work?", a: "We use Claude, one of the most advanced AIs on the market. It learns about your band, your sound and your audience to generate 100% personalized, ready-to-use content." },
        { q: "Do I need technical knowledge?", a: "No! Just log in with your subscription email. Pick a module, describe the context, and the AI generates everything for you." },
      ],
    },
    finalCta: {
      title: "Start Your Music Journey Today",
      desc: "Join independent Brazilian musicians evolving their careers with TuneSignal and BandBrain.",
      cta: "Subscribe Free",
    },
    footer: {
      tagline: "AI-powered music intelligence for independent artists.",
      copy: "© 2026 TuneSignal. All rights reserved.",
    },
  },
};

// ═══════════════════════════════════════
// DEMO CONTENT FOR BANDBRAIN PREVIEW
// ═══════════════════════════════════════

const DEMO_PT = `## 📅 Calendário Social — Semana 1

### Segunda-feira
**Instagram Post** — Teaser do novo single
📝 "Algo vem aí... 🎵 Quinta-feira."
⏰ Postar às 19h | 🏷️ #novamusica #indierock #musicabr

### Terça-feira
**Stories** — Behind the scenes do estúdio
💬 "Sessão real de gravação. Vocês estão prontos?"
✨ Use enquete: "Qual beat vocês preferem?"

### Quarta-feira
**Reels** — Snippet de 15s do single
📝 "15 segundos que vão mudar tudo. 🔥"
⏰ Postar às 12h | 🏷️ #musicaindependente #lançamento`;

const DEMO_EN = `## 📅 Social Calendar — Week 1

### Monday
**Instagram Post** — New single teaser
📝 "Something is coming... 🎵 Thursday."
⏰ Post at 7PM | 🏷️ #newmusic #indierock #music

### Tuesday
**Stories** — Studio behind the scenes
💬 "Real recording session. Are you ready?"
✨ Use poll: "Which beat do you prefer?"

### Wednesday
**Reels** — 15s single snippet
📝 "15 seconds that will change everything. 🔥"
⏰ Post at 12PM | 🏷️ #independentmusic #release`;

// ═══════════════════════════════════════
// FAQ ITEM COMPONENT
// ═══════════════════════════════════════

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-border rounded-lg overflow-hidden transition-all hover:border-brand-green/30">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="text-white font-semibold pr-4">{q}</span>
        <span className={`text-brand-green text-xl flex-shrink-0 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-brand-border/50 pt-4">{a}</div>}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "ok" | "err">("idle");

  const t = T[lang];

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    setFormState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setFormState("ok");
        setName("");
        setEmail("");
      } else {
        setFormState("err");
      }
    } catch {
      setFormState("err");
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* ─── BG BLOBS ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 h-8">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="wave-bar w-1 bg-brand-green rounded-full" style={{ height: "8px" }} />
            ))}
          </div>
          <span className="text-xl font-bold">
            <span className="gradient-text">TuneSignal</span>
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">{t.nav.features}</a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">{t.nav.pricing}</a>
          <a href="#bandbrain" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">{t.nav.bandbrain}</a>
          <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">{t.nav.faq}</a>
          <button
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="px-3 py-1 text-xs font-mono border border-brand-border rounded-md text-zinc-400 hover:text-white hover:border-brand-green/50 transition-colors"
          >
            {lang === "pt" ? "EN" : "PT"}
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-brand-green/80 to-brand-purple/80 text-white rounded-lg hover:brightness-110 transition-all hidden sm:block"
          >
            {t.nav.dashboard}
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
          {t.hero.badge}
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6">
          {t.hero.h1a}
          <br />
          <span className="gradient-text">{t.hero.h1b}</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">{t.hero.sub}</p>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <input
            type="text"
            placeholder={t.hero.namePh}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-3 bg-brand-card border border-brand-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green/50 transition-colors"
          />
          <input
            type="email"
            placeholder={t.hero.emailPh}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-brand-card border border-brand-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green/50 transition-colors"
          />
          <button
            type="submit"
            disabled={formState === "loading"}
            className="px-6 py-3 bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all glow-green disabled:opacity-50 whitespace-nowrap"
          >
            {formState === "loading" ? t.hero.sending : t.hero.cta}
          </button>
        </form>

        {formState === "ok" && <p className="text-brand-green text-sm mt-4 font-semibold">{t.hero.ok}</p>}
        {formState === "err" && <p className="text-red-400 text-sm mt-4">{t.hero.err}</p>}

        <p className="text-xs text-zinc-600 mt-6">{t.hero.social}</p>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t.features.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.cards.map((c, i) => (
            <div key={i} className="gradient-border p-6 bg-brand-card hover:bg-brand-card/80 transition-colors group">
              <span className="text-3xl mb-4 block">{c.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-green transition-colors">{c.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BANDBRAIN ═══ */}
      <section id="bandbrain" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="gradient-border p-8 sm:p-12 bg-brand-card">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-brand-purple text-xs font-mono mb-6">
              <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-pulse" />
              {t.bandbrain.badge}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-2">{t.bandbrain.title}</h2>
            <p className="text-xl sm:text-2xl font-bold text-brand-purple mb-6">{t.bandbrain.subtitle}</p>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">{t.bandbrain.desc}</p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {t.bandbrain.pills.map((p, i) => (
              <span key={i} className="px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-sm text-brand-purple">
                {p}
              </span>
            ))}
          </div>

          {/* AI Demo Preview */}
          <div className="gradient-border bg-brand-darker p-6 mb-10 rounded-lg">
            <p className="text-xs text-brand-green font-mono mb-4">{t.bandbrain.demoLabel}</p>
            <pre className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
              {lang === "pt" ? DEMO_PT : DEMO_EN}
            </pre>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-gradient-to-r from-brand-green/80 to-brand-purple/80 text-white font-bold rounded-lg hover:brightness-110 transition-all text-lg"
            >
              {t.bandbrain.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{t.pricing.title}</h2>
        <p className="text-zinc-500 text-center mb-16">{t.pricing.subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {t.pricing.tiers.map((tier, i) => {
            const isFeatured = tier.style === "featured";
            return (
              <div
                key={i}
                className={`gradient-border p-8 bg-brand-card relative ${isFeatured ? "glow-green" : ""}`}
              >
                {"badge" in tier && tier.badge && (
                  <div className="absolute -top-3 right-6 px-3 py-1 bg-brand-green text-brand-darker text-xs font-bold rounded-full">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-white">{tier.price}</span>
                  <span className="text-sm text-zinc-500">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="text-brand-green">✓</span> {f}
                    </li>
                  ))}
                </ul>
                {tier.href.startsWith("#") ? (
                  <a
                    href={tier.href}
                    className={`block w-full py-3 text-center font-semibold rounded-lg transition-all ${
                      isFeatured
                        ? "bg-brand-green text-brand-darker hover:brightness-110"
                        : "border border-brand-green/50 text-brand-green hover:bg-brand-green/10"
                    }`}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <a
                    href={tier.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-3 text-center font-semibold rounded-lg transition-all ${
                      isFeatured
                        ? "bg-brand-green text-brand-darker hover:brightness-110"
                        : "bg-brand-purple text-white hover:brightness-110"
                    }`}
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="relative z-10 px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t.faq.title}</h2>
        <div className="space-y-4">
          {t.faq.items.map((item, i) => (
            <FAQ key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="gradient-border p-10 sm:p-16 bg-brand-card">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            <span className="gradient-text">{t.finalCta.title}</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">{t.finalCta.desc}</p>
          <a
            href="#hero"
            className="inline-block px-8 py-4 bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all glow-green text-lg"
          >
            {t.finalCta.cta}
          </a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 px-6 py-12 border-t border-brand-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-8">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="wave-bar w-1 bg-brand-green rounded-full" style={{ height: "8px" }} />
              ))}
            </div>
            <span className="font-bold gradient-text">TuneSignal</span>
          </div>
          <p className="text-xs text-zinc-600">{t.footer.tagline}</p>
          <p className="text-xs text-zinc-600">{t.footer.copy}</p>
        </div>
      </footer>
    </div>
  );
}
