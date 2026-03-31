"use client";

import { useState, useEffect } from "react";
import { translations } from "@/lib/translations";

type Lang = "en" | "pt";

function Waveform() {
  return (
    <div className="flex items-center gap-1 h-8">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="wave-bar w-1 bg-brand-green rounded-full"
          style={{ height: "8px" }}
        />
      ))}
    </div>
  );
}

function SubscribeForm({ t, lang }: { t: typeof translations.en; lang: Lang }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "landing_page" }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="gradient-border p-6 bg-brand-card text-center">
        <p className="text-brand-green text-lg font-semibold">{t.form.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
      <input
        type="text"
        placeholder={t.form.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="flex-1 px-4 py-3 bg-brand-card border border-brand-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green/50 transition-colors"
      />
      <input
        type="email"
        placeholder={t.form.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-3 bg-brand-card border border-brand-border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-green/50 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-3 bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all glow-green disabled:opacity-50 whitespace-nowrap"
      >
        {status === "sending" ? t.form.sending : t.form.button}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm mt-1">{t.form.error}</p>
      )}
    </form>
  );
}

function SubscriberCount({ lang }: { lang: Lang }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/subscribers/count")
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, []);

  if (count === null || count < 5) return null;

  return (
    <span className="text-brand-green font-semibold">{count}+</span>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-brand-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-center justify-between gap-4"
      >
        <h3 className="font-semibold text-white text-sm">{q}</h3>
        <span
          className={`text-brand-green flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="text-zinc-400 text-sm pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = translations[lang];

  return (
    <div className="relative min-h-screen">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Waveform />
          <div>
            <span className="text-xl font-bold">
              <span className="gradient-text">Verelus</span>
            </span>
            <p className="text-xs text-zinc-500">Music Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            TuneSignal
          </a>
          <a href="#bandbrain" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {t.nav.bandbrain}
          </a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {t.nav.pricing}
          </a>
          <a href="/archive" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {lang === "pt" ? "Arquivo" : "Archive"}
          </a>
          <button
            onClick={() => setLang(lang === "en" ? "pt" : "en")}
            className="px-3 py-1 text-xs font-mono border border-brand-border rounded-md text-zinc-400 hover:text-white hover:border-brand-green/50 transition-colors"
          >
            {t.nav.language}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
          A Verelus Product
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight mb-6">
          {t.hero.title}
          <br />
          <span className="gradient-text">{t.hero.titleAccent}</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          {t.hero.subtitle}
        </p>

        <SubscribeForm t={t} lang={lang} />

        <p className="text-xs text-zinc-600 mt-4">{t.hero.ctaSub}</p>
      </section>

      {/* Social Proof / Logos */}
      <section className="relative z-10 px-6 py-10 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs text-zinc-600 uppercase tracking-wider font-mono">
            {lang === "pt" ? "Feito para quem vive de música" : "Built for music professionals"}
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
          {["Spotify", "Apple Music", "Deezer", "YouTube Music", "SoundCloud", "Bandcamp"].map((name) => (
            <span key={name} className="text-sm font-mono text-zinc-500 tracking-widest">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {lang === "pt" ? "Como Funciona" : "How It Works"}
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
          {lang === "pt"
            ? "Três passos simples para ter inteligência de mercado musical toda semana."
            : "Three simple steps to get weekly music market intelligence."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {(lang === "pt"
            ? [
                { step: "01", title: "Inscreva-se", desc: "Digite seu nome e email. Leva 5 segundos. Sem cartão de crédito, sem compromisso." },
                { step: "02", title: "Receba toda segunda", desc: "Nossa IA analisa milhares de fontes do mercado musical e cura o que realmente importa para você." },
                { step: "03", title: "Aplique e cresça", desc: "Use os insights, oportunidades de sync e dicas práticas para alavancar sua carreira musical." },
              ]
            : [
                { step: "01", title: "Subscribe", desc: "Enter your name and email. Takes 5 seconds. No credit card, no commitment." },
                { step: "02", title: "Get it every Monday", desc: "Our AI analyzes thousands of music industry sources and curates what matters most to you." },
                { step: "03", title: "Apply and grow", desc: "Use the insights, sync opportunities and pro tips to level up your music career." },
              ]
          ).map((item) => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/20 mb-4">
                <span className="text-brand-green font-mono font-bold text-sm">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          {t.features.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((item, i) => (
            <div
              key={i}
              className="gradient-border p-6 bg-brand-card hover:bg-brand-card/80 transition-colors group"
            >
              <span className="text-3xl mb-4 block">{item.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-green transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Preview */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          {lang === "pt" ? "Veja o Que Você Recebe" : "See What You Get"}
        </h2>
        <p className="text-zinc-400 text-center mb-10 max-w-2xl mx-auto">
          {lang === "pt"
            ? "Um preview de como é cada edição do TuneSignal."
            : "A preview of what each TuneSignal edition looks like."}
        </p>
        <div className="gradient-border bg-brand-card p-6 sm:p-8 max-w-2xl mx-auto">
          <div className="border-b border-zinc-800/50 pb-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-brand-green rounded-full" />
              <span className="text-xs font-mono text-brand-green">TuneSignal Weekly</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {lang === "pt"
                ? "TuneSignal #13 — O Sinal Semanal"
                : "TuneSignal #13 — The Weekly Signal"}
            </h3>
          </div>

          <div className="space-y-5 text-sm">
            <div>
              <h4 className="font-semibold text-brand-green mb-2 flex items-center gap-2">
                <span>🔥</span> {lang === "pt" ? "Top 3 Notícias" : "Top 3 News"}
              </h4>
              <div className="space-y-2 text-zinc-400">
                <p>
                  <span className="text-white font-medium">1.</span>{" "}
                  {lang === "pt"
                    ? "Spotify anuncia novo programa de royalties para artistas indie brasileiros..."
                    : "Spotify announces new royalty program for Brazilian indie artists..."}
                </p>
                <p>
                  <span className="text-white font-medium">2.</span>{" "}
                  {lang === "pt"
                    ? "TikTok lança ferramenta de distribuição direta para músicos..."
                    : "TikTok launches direct distribution tool for musicians..."}
                </p>
                <p>
                  <span className="text-white font-medium">3.</span>{" "}
                  {lang === "pt"
                    ? "Mercado de sync licensing cresce 34% no Brasil em 2026..."
                    : "Sync licensing market grows 34% in Brazil in 2026..."}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/50 pt-4">
              <h4 className="font-semibold text-brand-purple mb-2 flex items-center gap-2">
                <span>🎯</span> {lang === "pt" ? "Oportunidade de Sync" : "Sync Opportunity"}
              </h4>
              <p className="text-zinc-400">
                {lang === "pt"
                  ? "Produtora de conteúdo para Netflix BR busca indie rock/dream pop para série original. Deadline: sexta-feira..."
                  : "Content studio for Netflix BR seeks indie rock/dream pop for original series. Deadline: Friday..."}
              </p>
            </div>

            <div className="border-t border-zinc-800/50 pt-4">
              <h4 className="font-semibold text-brand-orange mb-2 flex items-center gap-2">
                <span>📊</span> {lang === "pt" ? "Tendência" : "Trend"}
              </h4>
              <p className="text-zinc-400">
                {lang === "pt"
                  ? "Artistas que postam 3+ Reels/semana têm 2.7x mais chance de entrar em playlists editoriais do Spotify..."
                  : "Artists who post 3+ Reels/week are 2.7x more likely to land Spotify editorial playlists..."}
              </p>
            </div>

            <div className="border-t border-zinc-800/50 pt-4 text-center">
              <p className="text-zinc-600 text-xs italic">
                {lang === "pt" ? "...e muito mais na edição completa" : "...and much more in the full edition"}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/archive"
            className="text-sm text-brand-green hover:text-brand-green/80 transition-colors"
          >
            {lang === "pt" ? "Ver edições anteriores →" : "See past editions →"}
          </a>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {lang === "pt" ? "O Que Dizem os Músicos" : "What Musicians Say"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(lang === "pt"
            ? [
                {
                  quote: "Finalmente uma newsletter que entende o mercado indie brasileiro. As dicas de sync já me renderam 2 placements.",
                  name: "Marina S.",
                  role: "Cantora/Compositora, SP",
                },
                {
                  quote: "Eu lia 15 blogs por semana pra ficar atualizado. Agora só preciso do TuneSignal na segunda de manhã.",
                  name: "Rafael T.",
                  role: "Produtor Musical, RJ",
                },
                {
                  quote: "A ferramenta da semana sozinha já vale a inscrição. Descobri plataformas que nunca teria encontrado.",
                  name: "Juliana M.",
                  role: "Guitarrista, Indie Rock, BH",
                },
              ]
            : [
                {
                  quote: "Finally a newsletter that understands the Brazilian indie market. The sync tips already landed me 2 placements.",
                  name: "Marina S.",
                  role: "Singer/Songwriter, SP",
                },
                {
                  quote: "I used to read 15 blogs a week to stay updated. Now I just need TuneSignal on Monday morning.",
                  name: "Rafael T.",
                  role: "Music Producer, RJ",
                },
                {
                  quote: "The tool of the week alone is worth subscribing. I've discovered platforms I'd never have found otherwise.",
                  name: "Juliana M.",
                  role: "Guitarist, Indie Rock, BH",
                },
              ]
          ).map((item, i) => (
            <div key={i} className="gradient-border p-6 bg-brand-card">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic">
                "{item.quote}"
              </p>
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BandBrain Section */}
      <section id="bandbrain" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="gradient-border p-8 sm:p-12 bg-brand-card text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-brand-purple text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-pulse" />
            A Verelus Product
          </div>

          <h2 className="text-3xl sm:text-5xl font-black mb-2">{t.bandbrain.title}</h2>
          <p className="text-xl sm:text-2xl font-bold text-brand-purple mb-6">
            {t.bandbrain.titleAccent}
          </p>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.bandbrain.subtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {t.bandbrain.features.map((f, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-sm text-brand-purple"
              >
                {f}
              </span>
            ))}
          </div>

          <SubscribeForm t={t} lang={lang} />
          <p className="text-xs text-zinc-600 mt-4">{t.bandbrain.ctaSub}</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-zinc-400">
            {lang === "pt" ? "Escolha o plano perfeito para sua jornada musical." : "Choose the perfect plan for your music journey."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Free */}
          <div className="gradient-border p-8 bg-brand-card">
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.free.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-white">{t.pricing.free.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.free.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.free.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="text-brand-green">✓</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="block w-full py-3 text-center border border-brand-green/50 text-brand-green font-semibold rounded-lg hover:bg-brand-green/10 transition-colors text-sm"
            >
              {t.pricing.free.cta}
            </a>
          </div>

          {/* Premium */}
          <div className="gradient-border p-8 bg-brand-card">
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.premium.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-white">{t.pricing.premium.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.premium.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.premium.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="text-brand-green">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId: "tunesignal_premium" }),
                });
                const data = await res.json() as { url?: string };
                if (data.url) window.location.href = data.url;
              }}
              className="block w-full py-3 text-center bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              {t.pricing.premium.cta}
            </button>
          </div>

          {/* Essencial */}
          <div className="gradient-border p-8 bg-brand-card">
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.essencial.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-white">{t.pricing.essencial.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.essencial.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.essencial.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="text-brand-purple">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId: "bandbrain_essencial" }),
                });
                const data = await res.json() as { url?: string };
                if (data.url) window.location.href = data.url;
              }}
              className="block w-full py-3 text-center border border-brand-purple/50 text-brand-purple font-semibold rounded-lg hover:bg-brand-purple/10 transition-colors text-sm"
            >
              {t.pricing.essencial.cta}
            </button>
          </div>

          {/* Pro */}
          <div className="gradient-border p-8 bg-brand-card glow-green relative">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-brand-green text-brand-darker text-xs font-bold rounded-full">
              {lang === "pt" ? "POPULAR" : "POPULAR"}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.pro.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-white">{t.pricing.pro.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.pro.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.pro.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="text-brand-green">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId: "bandbrain_pro" }),
                });
                const data = await res.json() as { url?: string };
                if (data.url) window.location.href = data.url;
              }}
              className="block w-full py-3 text-center bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              {t.pricing.pro.cta}
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          {lang === "pt" ? "Perguntas Frequentes" : "Frequently Asked Questions"}
        </h2>
        <div className="gradient-border bg-brand-card p-6 sm:p-8">
          {(lang === "pt"
            ? [
                {
                  q: "O TuneSignal é realmente grátis?",
                  a: "Sim! A newsletter semanal é 100% gratuita e sempre será. O plano Pro oferece análises mais profundas e acesso antecipado ao BandBrain para quem quer ir além.",
                },
                {
                  q: "Com que frequência recebo a newsletter?",
                  a: "Toda segunda-feira de manhã, às 8h (horário de Brasília). Pontual como um metrônomo.",
                },
                {
                  q: "O que é o BandBrain?",
                  a: "É seu gerente de banda com IA. Gera calendários de redes sociais, press releases, estratégias de setlist, pitches para playlists e relatórios mensais — tudo personalizado para sua banda e gênero.",
                },
                {
                  q: "Posso cancelar a qualquer momento?",
                  a: "Claro! Cada email tem um link de cancelamento no rodapé. Sem burocracia, sem letras miúdas.",
                },
                {
                  q: "Como a IA cura o conteúdo?",
                  a: "Nossa IA analisa centenas de fontes do mercado musical global e brasileiro, filtra o que é relevante para músicos independentes, e entrega insights acionáveis — não apenas notícias requentadas.",
                },
                {
                  q: "Serve para qualquer gênero musical?",
                  a: "Sim. Nossos insights cobrem a indústria musical como um todo, mas com foco especial na cena independente brasileira. Rock, MPB, eletrônica, hip hop, sertanejo indie — todos se beneficiam.",
                },
              ]
            : [
                {
                  q: "Is TuneSignal really free?",
                  a: "Yes! The weekly newsletter is 100% free and always will be. The Pro plan offers deeper analysis and early access to BandBrain for those who want more.",
                },
                {
                  q: "How often do I get the newsletter?",
                  a: "Every Monday morning at 8 AM (Brazil time). As punctual as a metronome.",
                },
                {
                  q: "What is BandBrain?",
                  a: "It's your AI band manager. It generates social media calendars, press releases, setlist strategies, playlist pitches and monthly reports — all customized for your band and genre.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Of course! Every email has an unsubscribe link in the footer. No hassle, no fine print.",
                },
                {
                  q: "How does the AI curate content?",
                  a: "Our AI analyzes hundreds of global and Brazilian music industry sources, filters what's relevant to independent musicians, and delivers actionable insights — not just reheated news.",
                },
                {
                  q: "Does it work for any music genre?",
                  a: "Yes. Our insights cover the music industry as a whole, with a special focus on the Brazilian independent scene. Rock, MPB, electronic, hip hop — everyone benefits.",
                },
              ]
          ).map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-black mb-4">
          {lang === "pt" ? (
            <>Pronto para receber o <span className="gradient-text">Sinal</span>?</>
          ) : (
            <>Ready to get the <span className="gradient-text">Signal</span>?</>
          )}
        </h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
          {lang === "pt"
            ? "Junte-se a músicos independentes que já estão usando inteligência artificial para alavancar suas carreiras."
            : "Join independent musicians who are already using AI intelligence to level up their careers."}
        </p>
        <div className="flex justify-center">
          <SubscribeForm t={t} lang={lang} />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-brand-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Waveform />
              <span className="font-bold gradient-text">Verelus</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-zinc-500 hover:text-white transition-colors">
                TuneSignal
              </a>
              <a href="#bandbrain" className="text-xs text-zinc-500 hover:text-white transition-colors">
                BandBrain
              </a>
              <a href="/archive" className="text-xs text-zinc-500 hover:text-white transition-colors">
                {lang === "pt" ? "Arquivo" : "Archive"}
              </a>
              <a href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors">
                BandBrain
              </a>
              <a href="/unsubscribe" className="text-xs text-zinc-500 hover:text-white transition-colors">
                {lang === "pt" ? "Cancelar inscrição" : "Unsubscribe"}
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">{t.footer.tagline}</p>
            <p className="text-xs text-zinc-600">{t.footer.copy}</p>
          </div>
          <p className="text-center text-xs text-zinc-700 mt-4">{lang === "pt" ? "TuneSignal e BandBrain são produtos da Verelus" : "TuneSignal and BandBrain are products by Verelus"}</p>
        </div>
      </footer>
    </div>
  );
}
