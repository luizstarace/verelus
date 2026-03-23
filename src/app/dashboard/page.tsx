"use client";

import { useState } from "react";

type Module = "calendar" | "press" | "setlist" | "pitch" | "report";

interface ModuleConfig {
  id: Module;
  icon: string;
  title: string;
  desc: string;
  prompt: string;
}

const modules: ModuleConfig[] = [
  {
    id: "calendar",
    icon: "📅",
    title: "Social Media Calendar",
    desc: "Generate 30 days of content for your social channels",
    prompt: "social_calendar",
  },
  {
    id: "press",
    icon: "📰",
    title: "Press Release",
    desc: "Professional press release for your next release",
    prompt: "press_release",
  },
  {
    id: "setlist",
    icon: "🎵",
    title: "Setlist Suggestion",
    desc: "Smart setlist based on your profile and context",
    prompt: "setlist",
  },
  {
    id: "pitch",
    icon: "✉️",
    title: "Playlist Pitch",
    desc: "Personalized pitch for playlist curators",
    prompt: "playlist_pitch",
  },
  {
    id: "report",
    icon: "📊",
    title: "Monthly Report",
    desc: "AI analysis of your metrics with recommendations",
    prompt: "monthly_report",
  },
];

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [bandName, setBandName] = useState("");
  const [genre, setGenre] = useState("");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  async function handleGenerate(mod: ModuleConfig) {
    setActiveModule(mod.id);
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mod.prompt,
          bandName,
          genre,
          context,
        }),
      });
      const data = await res.json();
      setOutput(data.content || "Something went wrong. Try again.");
    } catch {
      setOutput("Error generating content. Check your connection.");
    }
    setLoading(false);
  }

  if (!setupDone) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center px-6">
        <div className="gradient-border p-8 bg-brand-card max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">
              <span className="gradient-text">BandBrain</span>
            </h1>
            <p className="text-zinc-400">Set up your band profile to get started</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Band Name</label>
              <input
                type="text"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder="e.g. The Signal Makers"
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-brand-purple/50"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Indie Rock, Alternative"
                className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-brand-purple/50"
              />
            </div>
            <button
              onClick={() => bandName && genre && setSetupDone(true)}
              disabled={!bandName || !genre}
              className="w-full py-3 bg-brand-purple text-white font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-30"
            >
              Start Using BandBrain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Header */}
      <header className="border-b border-brand-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black gradient-text">BandBrain</span>
            <span className="text-sm text-zinc-500">|</span>
            <span className="text-sm text-zinc-400">{bandName}</span>
          </div>
          <a href="/" className="text-xs text-zinc-500 hover:text-brand-green transition-colors">
            \u2190 TuneSignal
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Modules */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
              AI Modules
            </h2>
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => handleGenerate(mod)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  activeModule === mod.id
                    ? "border-brand-purple bg-brand-purple/10"
                    : "border-brand-border bg-brand-card hover:border-brand-purple/30"
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mod.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{mod.title}</h3>
                    <p className="text-xs text-zinc-500">{mod.desc}</p>
                  </div>
                </div>
              </button>
            ))}

            {/* Context input */}
            <div className="mt-6">
              <label className="text-sm text-zinc-500 mb-2 block">Extra context (optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. We just released a new single called 'Midnight Signal'..."
                rows={3}
                className="w-full px-4 py-3 bg-brand-card border border-brand-border rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-brand-purple/50 resize-none"
              />
            </div>
          </div>

          {/* Main - Output */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="gradient-border p-12 bg-brand-card flex flex-col items-center justify-center min-h-[400px]">
                <div className="flex gap-2 mb-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-brand-purple rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-zinc-400 text-sm">AI is generating your content...</p>
              </div>
            ) : output ? (
              <div className="gradient-border p-8 bg-brand-card min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-brand-purple">
                    {modules.find((m) => m.id === activeModule)?.title}
                  </h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="px-3 py-1 text-xs border border-brand-border rounded-md text-zinc-400 hover:text-white hover:border-brand-green/50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">
                    {output}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="gradient-border p-12 bg-brand-card flex flex-col items-center justify-center min-h-[400px] text-center">
                <span className="text-5xl mb-4">🧠</span>
                <h3 className="text-xl font-bold text-white mb-2">Ready to create</h3>
                <p className="text-zinc-500 max-w-sm">
                  Select a module on the left to generate AI-powered content for{" "}
                  <span className="text-brand-purple font-semibold">{bandName}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
