"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

interface ArtistProfile {
  id: string;
  band_name: string;
  genre: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  instagram_handle: string | null;
  spotify_profile_url: string | null;
  photos: any;
  social_links: any;
}

export default function EPKPage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [epkContent, setEpkContent] = useState<string>("");
  const [epkHistory, setEpkHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();
    if (!userData) return;

    const { data: profileData } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", userData.id)
      .single();
    if (profileData) setProfile(profileData);

    const { data: epkData } = await supabase
      .from("ai_outputs")
      .select("*")
      .eq("user_id", userData.id)
      .eq("type", "epk")
      .order("created_at", { ascending: false })
      .limit(5);
    if (epkData) setEpkHistory(epkData);

    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "epk", profileId: profile?.id }),
      });
      const data = await res.json();
      if (data.content) setEpkContent(data.content);
    } catch (err) {
      console.error("Error generating EPK:", err);
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
          <h1 className="font-display text-xl text-white tracking-wider">KIT DE IMPRENSA (EPK)</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Perfil do Artista</h2>

              {profile ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Nome</p>
                    <p className="text-white text-sm">{profile.band_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Gênero</p>
                    <p className="text-white text-sm">{profile.genre || "Não definido"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Localização</p>
                    <p className="text-white text-sm">{[profile.city, profile.country].filter(Boolean).join(", ") || "Não definida"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Bio</p>
                    <p className="text-white text-sm line-clamp-4">{profile.bio || "Nenhuma bio cadastrada"}</p>
                  </div>
                  <a href="/dashboard/profile" className="block text-center text-sm text-brand-green hover:underline mt-4">
                    Editar perfil
                  </a>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-3">Nenhum perfil cadastrado</p>
                  <a href="/dashboard/profile" className="px-4 py-2 bg-brand-green text-bg-primary rounded-lg text-sm font-medium">
                    Criar perfil
                  </a>
                </div>
              )}
            </div>

            {/* EPK History */}
            {epkHistory.length > 0 && (
              <div className="bg-bg-surface border border-white/10 rounded-xl p-6 mt-4">
                <h3 className="text-sm font-semibold text-white mb-3">EPKs Anteriores</h3>
                <div className="space-y-2">
                  {epkHistory.map((epk) => (
                    <button
                      key={epk.id}
                      onClick={() => setEpkContent(epk.output_content || "")}
                      className="w-full text-left px-3 py-2 rounded-lg border border-white/5 hover:border-brand-green/30 transition-colors"
                    >
                      <p className="text-white text-xs font-medium">
                        {new Date(epk.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {(epk.output_content || "").substring(0, 60)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: EPK Content */}
          <div className="lg:col-span-2">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Seu EPK</h2>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !profile}
                  className="px-4 py-2 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50"
                >
                  {generating ? "Gerando..." : "✨ Gerar EPK com IA"}
                </button>
              </div>

              {epkContent ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="bg-bg-primary border border-white/10 rounded-xl p-6 whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                    {epkContent}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
                      Copiar texto
                    </button>
                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
                      Exportar PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-4">📋</p>
                  <p className="text-sm">
                    {profile
                      ? 'Clique em "Gerar EPK com IA" para criar seu kit de imprensa'
                      : "Cadastre seu perfil de artista primeiro"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
