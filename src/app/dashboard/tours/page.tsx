"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function TourPlanningPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();
    if (!userData) { setLoading(false); return; }

    const { data: outputs } = await supabase
      .from("ai_outputs")
      .select("id, output_content, created_at")
      .eq("user_id", userData.id)
      .eq("type", "tour_plan")
      .order("created_at", { ascending: false })
      .limit(10);

    if (outputs) {
      setHistory(outputs);
      if (outputs.length > 0) setContent(outputs[0].output_content || "");
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tour_plan" }),
      });
      const data = await res.json();
      if (data.content) setContent(data.content);
    } catch (err) {
      console.error("Error:", err);
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-white/10 bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">\u2190 Dashboard</a>
          <h1 className="font-display text-xl text-white tracking-wider">PLANEJAMENTO DE TURN\u00caS</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: History */}
          <div className="lg:col-span-1">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Hist\u00f3rico</h3>
              {history.length === 0 ? (
                <p className="text-gray-500 text-xs">Nenhum registro</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setContent(item.output_content || "")}
                      className="w-full text-left px-3 py-2 rounded-lg border border-white/5 hover:border-brand-green/30 transition-colors"
                    >
                      <p className="text-white text-xs font-medium">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {(item.output_content || "").substring(0, 50)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Planejador de Turn\u00eas</h2>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50"
                >
                  {generating ? "Gerando..." : "\u2728 Gerar Plano"}
                </button>
              </div>

              {content ? (
                <div>
                  <div className="bg-bg-primary border border-white/10 rounded-xl p-6 whitespace-pre-wrap text-gray-300 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                    {content}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigator.clipboard.writeText(content)} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
                      Copiar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-4">\u{1F30D}</p>
                  <p className="text-sm">Gere um plano completo de turn\u00ea com rotas e log\u00edstica</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
