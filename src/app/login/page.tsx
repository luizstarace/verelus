"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { translations } from "@/lib/translations";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [lang] = useState<"pt" | "en">("pt");
  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar link de login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wider mb-2">
            VERELUS
          </h1>
          <p className="text-gray-400 text-sm">
            {lang === "pt" ? "Plataforma de Inteligência Musical" : "Music Intelligence Platform"}
          </p>
        </div>

        <div className="bg-bg-surface border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {lang === "pt" ? "Verifique seu email" : "Check your email"}
              </h2>
              <p className="text-gray-400 text-sm">
                {lang === "pt"
                  ? `Enviamos um link mágico para ${email}. Clique no link para entrar.`
                  : `We sent a magic link to ${email}. Click the link to sign in.`}
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-6 text-brand-green text-sm hover:underline"
              >
                {lang === "pt" ? "Tentar outro email" : "Try another email"}
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">
                {lang === "pt" ? "Entrar na sua conta" : "Sign in to your account"}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {lang === "pt"
                  ? "Use seu email para receber um link de acesso"
                  : "Use your email to receive an access link"}
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 bg-bg-primary border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/50 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-bg-primary font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (lang === "pt" ? "Enviando..." : "Sending...")
                    : (lang === "pt" ? "Enviar link de acesso" : "Send access link")}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="/" className="text-gray-400 text-sm hover:text-white transition-colors">
                  {lang === "pt" ? "Voltar para o início" : "Back to home"}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
