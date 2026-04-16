"use client";

import { useState, useEffect } from "react";
import { translations } from "@/lib/translations";

// Detect Supabase Auth recovery/invite tokens in URL hash and redirect to reset page
function useAuthRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("type=invite"))) {
      // Preserve the hash when redirecting so Supabase client can pick up the tokens
      window.location.replace("/auth/reset" + hash);
    }
    // Also handle the case where Supabase sends tokens via query string
    const search = window.location.search;
    if (search && search.includes("type=recovery")) {
      window.location.replace("/auth/reset" + search + hash);
    }
  }, []);
}

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

function SignUpForm({ t, lang }: { t: typeof translations.en; lang: Lang }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
      <input
        type="text"
        placeholder={t.form.artistName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="flex-1 px-4 py-3.5 bg-brand-card border border-white/[0.06] rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-green/50 transition-colors"
      />
      <input
        type="email"
        placeholder={t.form.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-3.5 bg-brand-card border border-white/[0.06] rounded-lg text-white placeholder-brand-muted focus:outline-none focus:border-brand-green/50 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="px-8 py-3.5 bg-brand-green text-brand-dark font-bold rounded-lg hover:brightness-110 transition-all glow-green disabled:opacity-50 whitespace-nowrap"
      >
        {status === "sending" ? t.form.submitting : t.form.submit}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm mt-1">{t.form.error}</p>
      )}
    </form>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4"
      >
        <h3 className="font-semibold text-white text-sm">{q}</h3>
        <span className={`text-brand-green flex-shrink-0 transition-transform duration-200 text-xl ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <p className="text-brand-muted text-sm pb-5 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent = "green" }: { icon: string; title: string; desc: string; accent?: string }) {
  const accentClass = accent === "purple" ? "group-hover:text-brand-purple" : accent === "orange" ? "group-hover:text-brand-orange" : "group-hover:text-brand-green";
  return (
    <div className="gradient-border p-6 bg-brand-card hover:bg-brand-surface transition-colors group">
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className={`text-lg font-semibold text-white mb-2 ${accentClass} transition-colors`}>
        {title}
      </h3>
      <p className="text-sm text-brand-muted leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = translations[lang];
  useAuthRedirect();

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
              <span className="gradient-text">{t.nav.logo}</span>
            </span>
            <p className="text-xs text-brand-muted">Ferramentas para musicos</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-brand-muted hover:text-white transition-colors hidden sm:block">
            {t.nav.features}
          </a>
          <a href="#pricing" className="text-sm text-brand-muted hover:text-white transition-colors hidden sm:block">
            {t.nav.pricing}
          </a>
          <a href="/dashboard" className="text-sm text-brand-muted hover:text-white transition-colors hidden sm:block">
            Dashboard
          </a>
          <button
            onClick={() => setLang(lang === "en" ? "pt" : "en")}
            className="px-3 py-1 text-xs font-mono border border-white/[0.06] rounded-md text-brand-muted hover:text-white hover:border-brand-green/50 transition-colors"
          >
            {t.nav.language}
          </button>
          <a
            href="/login"
            className="px-4 py-2 text-sm font-semibold bg-brand-green text-brand-dark rounded-lg hover:brightness-110 transition-all"
          >
            {lang === "pt" ? "Entrar" : "Login"}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
          {lang === "pt" ? "11 ferramentas — R$29/mes" : "11 tools — R$29/month"}
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-none mb-6">
          <span className="gradient-text">{t.hero.headline}</span>
        </h1>

        <p className="text-lg sm:text-xl text-brand-muted max-w-3xl mb-4 leading-relaxed">
          {t.hero.subheadline}
        </p>

        <p className="text-sm text-brand-muted/70 max-w-2xl mb-10">
          {t.hero.description}
        </p>

        <SignUpForm t={t} lang={lang} />

        <p className="text-xs text-brand-muted/50 mt-4">{t.hero.trust}</p>
      </section>

      {/* Integrations */}
      <section className="relative z-10 px-6 py-10 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs text-brand-muted/50 uppercase tracking-wider font-mono">
            {lang === "pt" ? "Integrado com" : "Integrated with"}
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-30">
          {["Spotify API", "YouTube API", "Claude AI", "Stripe", "Resend"].map((name) => (
            <span key={name} className="text-sm font-mono text-brand-muted tracking-widest">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Toolbox Section */}
      <section id="promotion" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green text-xs font-mono mb-6">
            {t.promotion.title}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl mb-4">
            {t.promotion.subtitle}
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto">{t.promotion.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(t.promotion.features).map((feature, i) => (
            <FeatureCard
              key={i}
              icon={["🎵", "🤖", "✨", "🚀", "📊", "🎯"][i]}
              title={feature.title}
              desc={feature.description}
              accent="green"
            />
          ))}
        </div>
      </section>

      {/* Growth & Strategy Section */}
      <section id="management" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-brand-purple text-xs font-mono mb-6">
            {t.management.title}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl mb-4">
            {t.management.subtitle}
          </h2>
          <p className="text-brand-muted max-w-2xl mx-auto">{t.management.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(t.management.features).filter((f) => f.title).map((feature, i) => (
            <FeatureCard
              key={i}
              icon={["📋", "📊", "🏆", "🎯", "📅", "🔮"][i]}
              title={feature.title}
              desc={feature.description}
              accent="purple"
            />
          ))}
        </div>
      </section>

      {/* Features / Why Verelus */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl mb-4">{t.features.title}</h2>
          <p className="text-brand-muted max-w-2xl mx-auto">{t.features.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { ...t.features.aiPowered, icon: "🧠" },
            { ...t.features.expertTuned, icon: "🎯" },
            { ...t.features.integrated, icon: "⚡" },
            { ...t.features.realTime, icon: "📊" },
            { ...t.features.teamCollaboration, icon: "👥" },
            { ...t.features.apiIntegration, icon: "🔗" },
          ].map((feature, i) => (
            <FeatureCard
              key={i}
              icon={feature.icon}
              title={feature.title}
              desc={feature.description}
              accent="orange"
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl text-center mb-12">
          {t.social.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {t.social.testimonials.map((item, i) => (
            <div key={i} className="gradient-border p-6 bg-brand-card">
              <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-white">{item.author}</p>
                <p className="text-xs text-brand-muted">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-5xl mb-4">{t.pricing.title}</h2>
          <p className="text-brand-muted">{t.pricing.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="gradient-border p-8 bg-brand-card">
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.plans.free.name}</h3>
            <p className="text-sm text-brand-muted mb-4">{t.pricing.plans.free.description}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">R$0</span>
              <span className="text-sm text-brand-muted">{t.pricing.plans.free.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.plans.free.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-brand-green mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="/login"
              className="block w-full py-3 text-center border border-brand-green/50 text-brand-green font-semibold rounded-lg hover:bg-brand-green/10 transition-colors text-sm"
            >
              {t.pricing.plans.free.cta}
            </a>
          </div>

          {/* Pro — POPULAR */}
          <div className="gradient-border p-8 bg-brand-card glow-green relative">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-brand-green text-brand-dark text-xs font-bold rounded-full">
              {lang === "pt" ? "MAIS POPULAR" : "MOST POPULAR"}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.plans.pro.name}</h3>
            <p className="text-sm text-brand-muted mb-4">{t.pricing.plans.pro.description}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">R${t.pricing.plans.pro.price}</span>
              <span className="text-sm text-brand-muted">{t.pricing.plans.pro.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.plans.pro.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-brand-green mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId: "pro" }),
                });
                const data = await res.json() as { url?: string };
                if (data.url) window.location.href = data.url;
              }}
              className="block w-full py-3 text-center bg-brand-green text-brand-dark font-bold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              {t.pricing.plans.pro.cta}
            </button>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-20 max-w-3xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl text-center mb-12">
          {t.pricing.faq.title}
        </h2>
        <div className="gradient-border bg-brand-card p-6 sm:p-8">
          {t.pricing.faq.items.map((item, i) => (
            <FAQItem key={i} q={item.question} a={item.answer} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-4xl sm:text-5xl mb-4">
          {lang === "pt" ? (
            <>Pronto pra levar sua <span className="gradient-text">carreira musical</span> a serio?</>
          ) : (
            <>Ready to take your <span className="gradient-text">music career</span> seriously?</>
          )}
        </h2>
        <p className="text-brand-muted mb-8 max-w-xl mx-auto">
          {lang === "pt"
            ? "11 ferramentas profissionais por R$29/mes. Teste gratis, sem cartao."
            : "11 professional tools for R$29/month. Free to try, no credit card."}
        </p>
        <div className="flex justify-center">
          <SignUpForm t={t} lang={lang} />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Waveform />
              <span className="font-bold gradient-text">Verelus</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-brand-muted hover:text-white transition-colors">
                {t.nav.features}
              </a>
              <a href="#pricing" className="text-xs text-brand-muted hover:text-white transition-colors">
                {t.nav.pricing}
              </a>
              <a href="/dashboard" className="text-xs text-brand-muted hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/privacy" className="text-xs text-brand-muted hover:text-white transition-colors">
                {lang === "pt" ? "Privacidade" : "Privacy"}
              </a>
              <a href="/terms" className="text-xs text-brand-muted hover:text-white transition-colors">
                {lang === "pt" ? "Termos" : "Terms"}
              </a>
              <a href="/unsubscribe" className="text-xs text-brand-muted hover:text-white transition-colors">
                {lang === "pt" ? "Cancelar inscrição" : "Unsubscribe"}
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-brand-muted/50">
              {t.footer.newsletter.description}
            </p>
            <p className="text-xs text-brand-muted/50">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
