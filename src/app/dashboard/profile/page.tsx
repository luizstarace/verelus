"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

interface ProfileForm {
  band_name: string;
  genre: string;
  bio: string;
  city: string;
  country: string;
  website: string;
  instagram_handle: string;
  tiktok_handle: string;
  youtube_handle: string;
  spotify_profile_url: string;
  artist_type: string;
}

const ARTIST_TYPES = [
  { value: "solo", label: "Solo" },
  { value: "band", label: "Banda" },
  { value: "producer", label: "Produtor" },
  { value: "manager", label: "Manager" },
  { value: "label", label: "Gravadora" },
];

const GENRES = [
  "Pop", "Rock", "Hip Hop", "R&B", "Eletrônica", "Sertanejo", "Funk", "MPB",
  "Forró", "Pagode", "Samba", "Reggae", "Jazz", "Blues", "Country", "Folk",
  "Indie", "Metal", "Punk", "Classical", "Lo-Fi", "Trap", "Drill", "Outro"
];

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    band_name: "", genre: "", bio: "", city: "", country: "Brasil",
    website: "", instagram_handle: "", tiktok_handle: "", youtube_handle: "",
    spotify_profile_url: "", artist_type: "solo"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [profileId, setProfileId] = useState<string>("");
  const [userPlan, setUserPlan] = useState("free");
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id, plan")
      .eq("email", session.user.email)
      .single();
    if (!userData) return;

    setUserId(userData.id);
    setUserPlan(userData.plan || "free");
    setUserEmail(session.user.email || "");

    const { data: profile } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("user_id", userData.id)
      .single();

    if (profile) {
      setProfileId(profile.id);
      setForm({
        band_name: profile.band_name || "",
        genre: profile.genre || "",
        bio: profile.bio || "",
        city: profile.city || "",
        country: profile.country || "Brasil",
        website: profile.website || "",
        instagram_handle: profile.instagram_handle || "",
        tiktok_handle: profile.tiktok_handle || "",
        youtube_handle: profile.youtube_handle || "",
        spotify_profile_url: profile.spotify_profile_url || "",
        artist_type: profile.artist_type || "solo",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const data = { ...form, user_id: userId };

    if (profileId) {
      await supabase.from("artist_profiles").update(data).eq("id", profileId);
    } else {
      const { data: newProfile } = await supabase.from("artist_profiles").insert(data).select().single();
      if (newProfile) setProfileId(newProfile.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleCancelSubscription() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Voce continuara com acesso ate o fim do periodo atual.")) return;
    setCanceling(true);
    setCancelMessage("");
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.success) {
        const cancelDate = data.cancel_at ? new Date(data.cancel_at).toLocaleDateString("pt-BR") : "";
        setCancelMessage(`Assinatura cancelada. Acesso ativo ate ${cancelDate || "o fim do periodo"}.`);
      } else {
        setCancelMessage(data.error || "Erro ao cancelar. Tente novamente.");
      }
    } catch {
      setCancelMessage("Erro ao cancelar. Tente novamente.");
    }
    setCanceling(false);
  }

  function updateField(field: keyof ProfileForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
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
          <h1 className="font-display text-xl text-white tracking-wider">PERFIL DO ARTISTA</h1>
          {saved && <span className="text-brand-green text-sm ml-auto">Salvo!</span>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Nome artístico *</label>
                <input type="text" required value={form.band_name} onChange={e => updateField("band_name", e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Tipo</label>
                <select value={form.artist_type} onChange={e => updateField("artist_type", e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50">
                  {ARTIST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Gênero musical</label>
                <select value={form.genre} onChange={e => updateField("genre", e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50">
                  <option value="">Selecione...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Cidade</label>
                <input type="text" value={form.city} onChange={e => updateField("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1.5">Bio</label>
                <textarea rows={4} value={form.bio} onChange={e => updateField("bio", e.target.value)}
                  placeholder="Conte sua história..."
                  className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 resize-none placeholder-gray-500" />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Redes Sociais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Instagram</label>
                <input type="text" value={form.instagram_handle} onChange={e => updateField("instagram_handle", e.target.value)}
                  placeholder="@seuartista"
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">TikTok</label>
                <input type="text" value={form.tiktok_handle} onChange={e => updateField("tiktok_handle", e.target.value)}
                  placeholder="@seuartista"
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">YouTube</label>
                <input type="text" value={form.youtube_handle} onChange={e => updateField("youtube_handle", e.target.value)}
                  placeholder="@seucanal"
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={e => updateField("website", e.target.value)}
                  placeholder="https://seusite.com"
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1.5">Spotify Profile URL</label>
                <input type="url" value={form.spotify_profile_url} onChange={e => updateField("spotify_profile_url", e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-4 py-2.5 bg-bg-primary border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-green/50 placeholder-gray-500" />
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="bg-bg-surface border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Seu Plano</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userPlan === "business" ? "bg-brand-purple/20 text-brand-purple" :
                userPlan === "pro" ? "bg-brand-green/20 text-brand-green" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
              </span>
              {userPlan === "free" && (
                <a href="/#pricing" className="text-brand-green text-sm hover:underline">
                  Fazer upgrade &rarr;
                </a>
              )}
              {userPlan !== "free" && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="text-red-400 text-sm hover:underline disabled:opacity-50"
                >
                  {canceling ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              )}
            </div>
            {cancelMessage && (
              <p className="text-sm mt-2 text-gray-400">{cancelMessage}</p>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Perfil"}
          </button>
        </form>
      </main>
    </div>
  );
}
