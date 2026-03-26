"use client";

import { useState, useEffect, useRef } from "react";

// âââââââââââââââââââââââââââââââââââââââ
// TYPES
// âââââââââââââââââââââââââââââââââââââââ

type ModuleId = "calendar" | "press" | "setlist" | "pitch" | "report";
type Tier = "starter" | "pro";
type View = "login" | "setup" | "dashboard";

interface ModuleConfig {
  id: ModuleId;
  icon: string;
  title: string;
  titlePt: string;
  desc: string;
  descPt: string;
  prompt: string;
  tier: "starter" | "pro";
  contextLabel: string;
  contextLabelPt: string;
  contextPlaceholder: string;
  contextPlaceholderPt: string;
}

interface UserSession {
  token: string;
  id: string;
  email: string;
  name: string;
  tier: Tier;
  product: string;
}

interface HistoryItem {
  id: string;
  module: ModuleId;
  content: string;
  bandName: string;
  context: string;
  timestamp: string;
  tokensUsed: number;
}

// âââââââââââââââââââââââââââââââââââââââ
// MODULE DEFINITIONS
// âââââââââââââââââââââââââââââââââââââââ

const modules: ModuleConfig[] = [
  {
    id: "calendar",
    icon: "ð",
    title: "Social Media Calendar",
    titlePt: "CalendÃ¡rio de Redes Sociais",
    desc: "30-day content calendar with captions, hashtags & timing",
    descPt: "CalendÃ¡rio de 30 dias com legendas, hashtags e horÃ¡rios",
    prompt: "social_calendar",
    tier: "starter",
    contextLabel: "What's happening with your band?",
    contextLabelPt: "O que estÃ¡ acontecendo com sua banda?",
    contextPlaceholder: "e.g. We're releasing a new single next month, playing a festival in 2 weeks...",
    contextPlaceholderPt: "Ex: Estamos lanÃ§ando um single novo mÃªs que vem, temos um show em 2 semanas...",
  },
  {
    id: "press",
    icon: "ð°",
    title: "Press Release",
    titlePt: "Press Release",
    desc: "Professional press release ready to send to media",
    descPt: "Press release profissional pronto para enviar Ã  mÃ­dia",
    prompt: "press_release",
    tier: "starter",
    contextLabel: "What is this press release about?",
    contextLabelPt: "Sobre o que Ã© esse press release?",
    contextPlaceholder: "e.g. New album 'Midnight Signal' dropping March 15, recorded in SÃ£o Paulo with producer X...",
    contextPlaceholderPt: "Ex: Novo Ã¡lbum 'Midnight Signal' saindo dia 15 de marÃ§o, gravado em SP com produtor X...",
  },
  {
    id: "setlist",
    icon: "ðµ",
    title: "Setlist Strategy",
    titlePt: "EstratÃ©gia de Setlist",
    desc: "3 smart setlists with energy mapping & stage tips",
    descPt: "3 setlists inteligentes com mapa de energia e dicas de palco",
    prompt: "setlist",
    tier: "pro",
    contextLabel: "Tell us about the show",
    contextLabelPt: "Conte sobre o show",
    contextPlaceholder: "e.g. 45-min opening set for a 500-cap venue, audience mostly 20-30 year olds...",
    contextPlaceholderPt: "Ex: Set de 45 min abrindo pra banda X, venue de 500 pessoas, pÃºblico de 20-30 anos...",
  },
  {
    id: "pitch",
    icon: "âï¸",
    title: "Playlist Pitch Kit",
    titlePt: "Kit de Pitch para Playlists",
    desc: "Complete pitch kit with emails, DMs & curator targets",
    descPt: "Kit completo com emails, DMs e curadores-alvo",
    prompt: "playlist_pitch",
    tier: "starter",
    contextLabel: "What are you pitching?",
    contextLabelPt: "O que vocÃª estÃ¡ pitchando?",
    contextPlaceholder: "e.g. New single 'Neon Dreams', indie pop with electronic elements, similar to Terno Rei...",
    contextPlaceholderPt: "Ex: Single novo 'Neon Dreams', indie pop com elementos eletrÃ´nicos, similar a Terno Rei...",
  },
  {
    id: "report",
    icon: "ð",
    title: "Monthly Strategy Report",
    titlePt: "RelatÃ³rio Mensal de EstratÃ©gia",
    desc: "Full business report with metrics, goals & action items",
    descPt: "RelatÃ³rio completo com mÃ©tricas, metas e aÃ§Ãµes",
    prompt: "monthly_report",
    tier: "pro",
    contextLabel: "Share any metrics or context",
    contextLabelPt: "Compartilhe mÃ©tricas ou contexto",
    contextPlaceholder: "e.g. 5k monthly listeners, 2k Instagram followers, played 3 shows last month...",
    contextPlaceholderPt: "Ex: 5k ouvintes mensais, 2k seguidores no Instagram, fizemos 3 shows mÃªs passado...",
  },
];

// âââââââââââââââââââââââââââââââââââââââ
// SIMPLE MARKDOWN RENDERER
// âââââââââââââââââââââââââââââââââââââââ

function renderMarkdown(text: string): string {
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-brand-purple mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-brand-green mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black gradient-text mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-300">$1</em>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      const isHeader = cells.every((c) => /^[-:]+$/.test(c));
      if (isHeader) return "";
      return `<tr>${cells.map((c) => `<td class="px-3 py-2 border border-zinc-700/50 text-sm">${c}</td>`).join("")}</tr>`;
    })
    // Checkboxes
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-zinc-600 mt-0.5">â</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-brand-green mt-0.5">â</span><span class="text-zinc-400 text-sm line-through">$1</span></div>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-brand-purple">â¢</span><span class="text-zinc-300 text-sm">$1</span></div>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-brand-orange font-mono text-sm min-w-[1.5rem]">$1.</span><span class="text-zinc-300 text-sm">$2</span></div>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-zinc-700/50 my-6" />')
    // Code blocks
    .replace(/`(.+?)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-brand-green text-sm font-mono">$1</code>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hdt]|<div|<hr|<tr)(.+)$/gm, '<p class="text-zinc-300 text-sm leading-relaxed my-1">$1</p>');

  // Wrap table rows
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, (match) => {
    return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-zinc-700/50 bg-zinc-900/50 rounded-lg">${match}</table></div>`;
  });

  return html;
}

// âââââââââââââââââââââââââââââââââââââââ
// MAIN DASHBOARD COMPONENT
// âââââââââââââââââââââââââââââââââââââââ

export default function Dashboard() {
  const [view, setView] = useState<View>("login");
  const [user, setUser] = useState<UserSession | null>(null);
  const [lang, setLang] = useState<"pt" | "en">("pt");

  // Band profile
  const [bandName, setBandName] = useState("");
  const [genre, setGenre] = useState("");

  // Generation state
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  // Check for stored session on mount
  useEffect(() => {
    const stored = localStorage.getItem("bandbrain_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setUser(session);
        const savedBand = localStorage.getItem("bandbrain_band");
        const savedGenre = localStorage.getItem("bandbrain_genre");
        if (savedBand && savedGenre) {
          setBandName(savedBand);
          setGenre(savedGenre);
          setView("dashboard");
        } else {
          setView("setup");
        }
      } catch {
        localStorage.removeItem("bandbrain_session");
      }
    }
    // Load history
    const savedHistory = localStorage.getItem("bandbrain_history");
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch {}
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("bandbrain_history", JSON.stringify(history.slice(0, 50)));
    }
  }, [history]);

  // âââ LOGIN âââââââââââââââââââââââââââ

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(
          data.error === "no_subscription"
            ? lang === "pt"
              ? "Nenhuma assinatura ativa encontrada para este email."
              : "No active subscription found for this email."
            : data.message || "Login failed"
        );
        return;
      }
      const session: UserSession = { token: data.token, ...data.user };
      setUser(session);
      localStorage.setItem("bandbrain_session", JSON.stringify(session));
      setView("setup");
    } catch {
      setLoginError(lang === "pt" ? "Erro de conexÃ£o. Tente novamente." : "Connection error. Try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  // âââ SETUP ââââââââââââââââââââââââââ

  function handleSetup() {
    if (bandName && genre) {
      localStorage.setItem("bandbrain_band", bandName);
      localStorage.setItem("bandbrain_genre", genre);
      setView("dashboard");
    }
  }

  // âââ LOGOUT âââââââââââââââââââââââââ

  function handleLogout() {
    localStorage.removeItem("bandbrain_session");
    localStorage.removeItem("bandbrain_band");
    localStorage.removeItem("bandbrain_genre");
    setUser(null);
    setView("login");
    setOutput("");
    setActiveModule(null);
  }

  // âââ GENERATE âââââââââââââââââââââââ

  async function handleGenerate(mod: ModuleConfig) {
    if (user && mod.tier === "pro" && user.tier === "starter") {
      setOutput(
        lang === "pt"
          ? `## ð MÃ³dulo Pro\n\nEste mÃ³dulo estÃ¡ disponÃ­vel apenas no plano **BandBrain Pro**.\n\nSeu plano atual: **Starter**\n\n[FaÃ§a upgrade para o Pro](/) para acessar:\n- ${modules.filter(m => m.tier === "pro").map(m => lang === "pt" ? m.titlePt : m.title).join("\n- ")}`
          : `## ð Pro Module\n\nThis module is only available on the **BandBrain Pro** plan.\n\nYour current plan: **Starter**\n\n[Upgrade to Pro](/) to access:\n- ${modules.filter(m => m.tier === "pro").map(m => m.title).join("\n- ")}`
      );
      setActiveModule(mod.id);
      return;
    }

    setActiveModule(mod.id);
    setLoading(true);
    setOutput("");
    setTokensUsed(0);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mod.prompt,
          bandName,
          genre,
          context,
          lang,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOutput(
          lang === "pt"
            ? "## Erro\n\nNÃ£o foi possÃ­vel gerar o conteÃºdo. Tente novamente em alguns segundos."
            : "## Error\n\nCould not generate content. Please try again in a few seconds."
        );
        setLoading(false);
        return;
      }

      setOutput(data.content || "No content generated");
      setTokensUsed(data.tokensUsed || 0);

      // Save to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        module: mod.id,
        content: data.content,
        bandName,
        context,
        timestamp: new Date().toISOString(),
        tokensUsed: data.tokensUsed || 0,
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch {
      setOutput(
        lang === "pt"
          ? "## Erro de ConexÃ£o\n\nVerifique sua conexÃ£o e tente novamente."
          : "## Connection Error\n\nCheck your connection and try again."
      );
    }
    setLoading(false);
  }

  // âââ COPY âââââââââââââââââââââââââââ

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // âââ EXPORT TXT âââââââââââââââââââââ

  function handleExport() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bandbrain-${activeModule}-${bandName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // âââ LOAD FROM HISTORY ââââââââââââââ

  function loadFromHistory(item: HistoryItem) {
    setActiveModule(item.module);
    setOutput(item.content);
    setTokensUsed(item.tokensUsed);
    setShowHistory(false);
  }

  // âââââââââââââââââââââââââââââââââââââââ
  // LOGIN VIEW
  // âââââââââââââââââââââââââââââââââââââââ

  if (view === "login") {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-6">
        <div className="gradient-border p-8 bg-brand-card max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">
              <span className="gradient-text">BandBrain</span>
            </h1>
            <p className="text-zinc-400 text-sm">
              {lang === "pt" ? "Seu gerente de banda com IA" : "Your AI band manager"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                {lang === "pt" ? "Email da sua assinatura" : "Your subscription email"}
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder={lang === "pt" ? "seu@email.com" : "your@email.com"}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-brand-purple/50"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{loginError}</p>
                <a
                  href="/"
                  className="text-brand-green text-xs hover:underline mt-1 inline-block"
                >
                  {lang === "pt" ? "â Adquira seu plano" : "â Get your plan"}
                </a>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!loginEmail || loginLoading}
              className="w-full py-3 bg-brand-purple text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-30"
            >
              {loginLoading
                ? lang === "pt" ? "Verificando..." : "Verifying..."
                : lang === "pt" ? "Entrar" : "Sign In"}
            </button>

            <div className="text-center">
              <button
                onClick={() => setLang(lang === "pt" ? "en" : "pt")}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {lang === "pt" ? "English" : "PortuguÃªs"}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-600">
              {lang === "pt"
                ? "Use o email cadastrado na compra via Asaas"
                : "Use the email from your Asaas purchase"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // âââââââââââââââââââââââââââââââââââââââ
  // SETUP VIEW
  // âââââââââââââââââââââââââââââââââââââââ

  if (view === "setup") {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-6">
        <div className="gradient-border p-8 bg-brand-card max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">
              <span className="gradient-text">BandBrain</span>
            </h1>
            <p className="text-zinc-400 text-sm">
              {lang === "pt"
                ? `OlÃ¡, ${user?.name || "mÃºsico"}! Configure seu perfil.`
                : `Hey, ${user?.name || "musician"}! Set up your profile.`}
            </p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              {user?.tier === "pro" ? "PRO" : "STARTER"}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                {lang === "pt" ? "Nome da Banda / Artista" : "Band / Artist Name"}
              </label>
              <input
                type="text"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder={lang === "pt" ? "Ex: Os Sinais" : "e.g. The Signal Makers"}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-brand-purple/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                {lang === "pt" ? "GÃªnero Musical" : "Genre"}
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder={lang === "pt" ? "Ex: Indie Rock, MPB, Lo-fi" : "e.g. Indie Rock, Alternative"}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-brand-purple/50"
              />
            </div>
            <button
              onClick={handleSetup}
              disabled={!bandName || !genre}
              className="w-full py-3 bg-brand-purple text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-30"
            >
              {lang === "pt" ? "ComeÃ§ar a usar o BandBrain" : "Start Using BandBrain"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // âââââââââââââââââââââââââââââââââââââââ
  // MAIN DASHBOARD VIEW
  // âââââââââââââââââââââââââââââââââââââââ

  const currentModule = modules.find((m) => m.id === activeModule);

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* âââ HEADER âââ */}
      <header className="border-b border-brand-border px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black gradient-text">BandBrain</span>
            <span className="text-zinc-700">|</span>
            <span className="text-sm text-zinc-400 truncate max-w-[120px]">{bandName}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              {user?.tier === "pro" ? "PRO" : "STARTER"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-zinc-500 hover:text-brand-green transition-colors"
              title={lang === "pt" ? "HistÃ³rico" : "History"}
            >
              {lang === "pt" ? "ð HistÃ³rico" : "ð History"}
            </button>
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {lang === "pt" ? "EN" : "PT"}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
            >
              {lang === "pt" ? "Sair" : "Logout"}
            </button>
            <a href="/" className="text-xs text-zinc-600 hover:text-brand-green transition-colors hidden sm:block">
              TuneSignal
            </a>
          </div>
        </div>
      </header>

      {/* âââ HISTORY PANEL âââ */}
      {showHistory && (
        <div className="border-b border-brand-border bg-brand-card/50 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-400">
                {lang === "pt" ? "HistÃ³rico de GeraÃ§Ãµes" : "Generation History"}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs text-zinc-600 hover:text-white"
              >
                â
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-600">
                {lang === "pt" ? "Nenhum conteÃºdo gerado ainda." : "No content generated yet."}
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.slice(0, 20).map((item) => {
                  const mod = modules.find((m) => m.id === item.module);
                  return (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="flex-shrink-0 p-3 rounded-lg bg-brand-dark border border-brand-border hover:border-brand-purple/40 transition-all text-left min-w-[180px]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{mod?.icon}</span>
                        <span className="text-xs font-semibold text-white truncate">
                          {lang === "pt" ? mod?.titlePt : mod?.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600">
                        {new Date(item.timestamp).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* âââ MAIN CONTENT âââ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* âââ SIDEBAR: MODULES âââ */}
          <div className="lg:col-span-3 space-y-2">
            <h2 className="text-xs font-mono text-zinc-600 uppercase tracking-wider mb-3">
              {lang === "pt" ? "MÃ³dulos IA" : "AI Modules"}
            </h2>

            {modules.map((mod) => {
              const isLocked = mod.tier === "pro" && user?.tier === "starter";
              const isActive = activeModule === mod.id;

              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setActiveModule(mod.id);
                    setContext("");
                    if (isLocked) {
                      handleGenerate(mod);
                    }
                  }}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-brand-purple bg-brand-purple/10"
                      : isLocked
                      ? "border-brand-border bg-brand-card/50 opacity-60"
                      : "border-brand-border bg-brand-card hover:border-brand-purple/30"
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mod.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {lang === "pt" ? mod.titlePt : mod.title}
                        </h3>
                        {isLocked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono flex-shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        {lang === "pt" ? mod.descPt : mod.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Context input appears when module is selected */}
            {activeModule && currentModule && !(currentModule.tier === "pro" && user?.tier === "starter") && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    {lang === "pt" ? currentModule.contextLabelPt : currentModule.contextLabel}
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={lang === "pt" ? currentModule.contextPlaceholderPt : currentModule.contextPlaceholder}
                    rows={4}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-brand-purple/50 resize-none"
                  />
                </div>
                <button
                  onClick={() => handleGenerate(currentModule)}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-green/80 to-brand-purple/80 text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-30 text-sm"
                >
                  {loading
                    ? lang === "pt" ? "Gerando..." : "Generating..."
                    : lang === "pt" ? "Gerar ConteÃºdo" : "Generate Content"}
                </button>
              </div>
            )}
          </div>

          {/* âââ MAIN: OUTPUT âââ */}
          <div className="lg:col-span-9" ref={outputRef}>
            {loading ? (
              <div className="gradient-border p-12 bg-brand-card flex flex-col items-center justify-center min-h-[500px]">
                <div className="flex gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-brand-purple rounded-full wave-bar"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-zinc-400 text-sm mb-1">
                  {lang === "pt" ? "BandBrain estÃ¡ criando seu conteÃºdo..." : "BandBrain is creating your content..."}
                </p>
                <p className="text-zinc-600 text-xs">
                  {lang === "pt" ? "Isso pode levar 15-30 segundos para conteÃºdo premium" : "This may take 15-30 seconds for premium content"}
                </p>
              </div>
            ) : output ? (
              <div className="gradient-border bg-brand-card min-h-[500px]">
                {/* Output header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentModule?.icon}</span>
                    <h3 className="text-sm font-bold text-white">
                      {lang === "pt" ? currentModule?.titlePt : currentModule?.title}
                    </h3>
                    {tokensUsed > 0 && (
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {tokensUsed.toLocaleString()} tokens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1 text-xs border border-brand-border rounded-md text-zinc-400 hover:text-white hover:border-brand-green/50 transition-colors"
                    >
                      {copied
                        ? lang === "pt" ? "Copiado!" : "Copied!"
                        : lang === "pt" ? "Copiar" : "Copy"}
                    </button>
                    <button
                      onClick={handleExport}
                      className="px-3 py-1 text-xs border border-brand-border rounded-md text-zinc-400 hover:text-white hover:border-brand-purple/50 transition-colors"
                    >
                      {lang === "pt" ? "Exportar .md" : "Export .md"}
                    </button>
                  </div>
                </div>
                {/* Output content */}
                <div
                  className="px-6 py-6 overflow-auto max-h-[70vh]"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }}
                />
              </div>
            ) : (
              <div className="gradient-border p-12 bg-brand-card flex flex-col items-center justify-center min-h-[500px] text-center">
                <span className="text-6xl mb-4">ð§ </span>
                <h3 className="text-xl font-bold text-white mb-2">
                  {lang === "pt" ? "Pronto para criar" : "Ready to create"}
                </h3>
                <p className="text-zinc-500 max-w-md text-sm">
                  {lang === "pt"
                    ? `Selecione um mÃ³dulo Ã  esquerda para gerar conteÃºdo profissional para `
                    : `Select a module on the left to generate professional content for `}
                  <span className="text-brand-purple font-semibold">{bandName}</span>.
                </p>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
                  {modules
                    .filter((m) => !(m.tier === "pro" && user?.tier === "starter"))
                    .map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => setActiveModule(mod.id)}
                        className="p-3 rounded-lg bg-brand-dark border border-brand-border hover:border-brand-purple/30 transition-all text-center"
                      >
                        <span className="text-2xl block mb-1">{mod.icon}</span>
                        <span className="text-[10px] text-zinc-500">
                          {lang === "pt" ? mod.titlePt : mod.title}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* âââ FOOTER âââ */}
      <footer className="border-t border-brand-border px-6 py-3 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-700">
          <span>BandBrain by TuneSignal</span>
          <span>{user?.email}</span>
        </div>
      </footer>
    </div>
  );
}
