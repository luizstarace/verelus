"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useArtistProfile } from "@/lib/use-artist-profile";

interface Track {
  id: string;
  title: string;
  album: string | null;
  genre: string | null;
  spotify_track_id: string | null;
}

interface Playlist {
  id: string;
  name: string;
  curator_name: string | null;
  genres: string[];
  followers: number;
  acceptance_rate: number | null;
}

interface PitchSubmission {
  id: string;
  track_id: string;
  playlist_id: string;
  pitch_text: string | null;
  match_score: number | null;
  status: string;
  created_at: string;
  tracks?: Track;
  playlists?: Playlist;
}

export default function PitchingPage() {
  const { profile: artistProfile } = useArtistProfile();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [pitches, setPitches] = useState<PitchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [pitchText, setPitchText] = useState("");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [pitchCount, setPitchCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id, plan")
      .eq("email", session.user.email)
      .single();

    if (!userData) return;
    setUserPlan(userData.plan || "free");

    const { data: trackData } = await supabase
      .from("tracks")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    if (trackData) setTracks(trackData);

    const { data: pitchData } = await supabase
      .from("pitch_submissions")
      .select("*, tracks(*), playlists(*)")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (pitchData) {
      setPitches(pitchData as any);
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthlyCount = pitchData.filter(p => p.created_at.startsWith(thisMonth)).length;
      setPitchCount(monthlyCount);
    }
    setLoading(false);
  }

  async function handleGeneratePitch() {
    if (!selectedTrack) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "playlist_pitch",
          context: { trackId: selectedTrack, artistProfile },
        }),
      });
      const data = await res.json();
      if (data.content) {
        setPitchText(data.content);
      }
    } catch (err) {
      console.error("Error generating pitch:", err);
    }
    setGenerating(false);
  }

  const pitchLimit = userPlan === "free" ? 3 : null;
  const canPitch = !pitchLimit || pitchCount < pitchLimit;

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
          <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </a>
          <h1 className="font-display text-xl text-white tracking-wider">ENVIO DE PLAYLISTS</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pitch Limit Banner */}
        {pitchLimit && (
          <div className="mb-6 bg-bg-surface border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">
                Pitches este mês: {pitchCount}/{pitchLimit}
              </p>
              <p className="text-gray-400 text-xs">
                Faça upgrade para Pro para pitches ilimitados
              </p>
            </div>
            {!canPitch && (
              <a href="/#pricing" className="px-4 py-2 bg-brand-green text-bg-primary rounded-lg text-sm font-medium">
                Fazer upgrade
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Create Pitch */}
          <div className="space-y-6">
            <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Novo Pitch</h2>

              {/* Add Track by Spotify URL */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-1.5">Link do Spotify</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="flex-1 px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-green/50"
                  />
                  <button className="px-4 py-2.5 bg-[#1DB954] text-white rounded-xl text-sm font-medium hover:bg-[#1ed760] transition-colors">
                    Importar
                  </button>
                </div>
              </div>

              {/* Select Track */}
              {tracks.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-1.5">Selecionar faixa</label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50"
                  >
                    <option value="">Escolha uma faixa...</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title} {t.album ? `(${t.album})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generate Pitch Text */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-300">Texto do pitch</label>
                  <button
                    onClick={handleGeneratePitch}
                    disabled={!selectedTrack || generating}
                    className="text-xs text-brand-green hover:text-brand-green/80 disabled:text-gray-500 transition-colors"
                  >
                    {generating ? "Gerando com IA..." : "✨ Gerar com IA"}
                  </button>
                </div>
                <textarea
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  rows={6}
                  placeholder="Descreva sua música e por que ela combina com a playlist..."
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-green/50 resize-none"
                />
              </div>

              <button
                disabled={!canPitch || !pitchText}
                className="w-full py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Pitch
              </button>
            </div>
          </div>

          {/* Right: Pitch History */}
          <div>
            <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Histórico de Pitches</h2>

              {pitches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Nenhum pitch enviado ainda</p>
                  <p className="text-gray-500 text-xs mt-1">Comece enviando seu primeiro pitch acima</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pitches.map((p) => (
                    <div key={p.id} className="border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm font-medium">{(p as any).tracks?.title || "Track"}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          p.status === "accepted" ? "bg-green-500/20 text-green-400" :
                          p.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          p.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {p.status === "accepted" ? "Aceito" : p.status === "rejected" ? "Rejeitado" : p.status === "sent" ? "Enviado" : "Rascunho"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">{(p as any).playlists?.name || "Playlist"}</p>
                      {p.match_score && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green rounded-full" style={{ width: `${p.match_score}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{p.match_score}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
