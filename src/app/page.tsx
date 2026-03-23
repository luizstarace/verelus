"use client";

import { useState } from "react";
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
          <span className="text-xl font-bold">
            <span className="gradient-text">TuneSignal</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {t.nav.features}
          </a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {t.nav.pricing}
          </a>
          <a href="#bandbrain" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
            {t.nav.bandbrain}
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
          {t.hero.badge}
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

      {/* BandBrain Section */}
      <section id="bandbrain" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="gradient-border p-8 sm:p-12 bg-brand-card text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-brand-purple text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-pulse" />
            {t.bandbrain.badge}
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
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          {t.pricing.title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="gradient-border p-8 bg-brand-card">
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.free.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">{t.pricing.free.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.free.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.free.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-brand-green">\u2713</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block w-full py-3 text-center border border-brand-green/50 text-brand-green font-semibold rounded-lg hover:bg-brand-green/10 transition-colors"
            >
              {t.pricing.free.cta}
            </a>
          </div>

          {/* Pro */}
          <div className="gradient-border p-8 bg-brand-card glow-green relative">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-brand-green text-brand-darker text-xs font-bold rounded-full">
              POPULAR
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t.pricing.pro.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-white">{t.pricing.pro.price}</span>
              <span className="text-sm text-zinc-500">{t.pricing.pro.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.pro.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-brand-green">\u2713</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="block w-full py-3 text-center bg-brand-green text-brand-darker font-bold rounded-lg hover:brightness-110 transition-all"
            >
              {t.pricing.pro.cta}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-brand-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Waveform />
            <span className="font-bold gradient-text">TuneSignal</span>
          </div>
          <p className="text-xs text-zinc-600">{t.footer.tagline}</p>
          <p className="text-xs text-zinc-600">{t.footer.copy}</p>
        </div>
      </footer>
    </div>
  );
}
