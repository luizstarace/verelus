"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useArtistProfile } from "@/lib/use-artist-profile";

export default function AnalysisPage() {
  const { profile: artistProfile } = useArtistProfile();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyData, setSpotifyData] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id, spotify_connected, spotify_data")
      .eq("email", session.user.email)
      .single();

    if (userData) {
      setSpotifyConnected(userData.spotify_connected || false);
      setSpotifyData(userData.spotify_data);
    }

    // Load latest analysis
    if (userData) {
      const { data: analysisData } = await supabase
        .from("ai_outputs")
        .select("output_content")
        .eq("user_id", userData.id)
        .eq("type", "artist_analysis")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (analysisData) setAnalysis(analysisData.output_content || "");
    }
    setLoading(false);
  }

  async function handleAnalyze() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "artist_analysis", context: { artistProfile } }),
      });
      const data = await res.json();
      if (data.content) setAnalysis(data.content);
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
          <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">← Dashboard</a>
          <h1 className="font-display text-xl text-white tracking-wider">ANÁLISE DE ARTISTA</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Spotify Connection */}
        {!spotifyConnected && (
          <div className="mb-8 bg-gradient-to-r from-[#1DB954]/10 to-brand-green/5 border border-[#1DB954]/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Conecte seu Spotify para análises completas</h3>
                <p className="text-gray-400 text-sm">Dados de ouvintes, streams, playlists e tendências</p>
              </div>
              <button className="px-4 py-2 bg-[#1DB954] text-white rounded-lg font-medium text-sm hover:bg-[#1ed760] transition-colors">
                Conectar Spotify
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {spotifyData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Ouvintes Mensais</p>
              <p className="text-2xl font-bold text-white">{spotifyData.monthly_listeners?.toLocaleString() || "—"}</p>
            </div>
            <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Seguidores</p>
              <p className="text-2xl font-bold text-white">{spotifyData.followers?.toLocaleString() || "—"}</p>
            </div>
            <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Playlists</p>
              <p className="text-2xl font-bold text-white">{spotifyData.playlist_count || "—"}</p>
            </div>
            <div className="bg-bg-surface border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Popularidade</p>
              <p className="text-2xl font-bold text-white">{spotifyData.popularity || "—"}/100</p>
            </div>
          </div>
        )}

        {/* Analysis */}
        <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Análise Completa</h2>
            <button
              onClick={handleAnalyze}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50"
            >
              {generating ? "Analisando..." : "✨ Gerar Análise com IA"}
            </button>
          </div>

          {analysis ? (
            <div className="bg-bg-primary border border-white/10 rounded-xl p-6 whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
              {analysis}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-sm">
                {spotifyConnected
                  ? 'Clique em "Gerar Análise com IA" para insights sobre seu perfil'
                  : "Conecte seu Spotify para análises baseadas em dados reais"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
