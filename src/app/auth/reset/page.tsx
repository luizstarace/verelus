'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabase();

    // Parse tokens from hash fragment if present (implicit flow from Supabase recovery link)
    if (typeof window !== 'undefined' && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: setErr }) => {
          if (setErr) {
            setSessionOk(false);
            setError('Link invalido ou expirado. Solicite um novo pela pagina de login.');
          } else {
            setSessionOk(true);
            // Clean hash from URL for cleanliness
            window.history.replaceState({}, '', '/auth/reset');
          }
        });
        return;
      }
    }

    // Fallback: check if there's already an active session (e.g., user came from /auth/callback)
    supabase.auth.getSession().then(({ data }) => {
      setSessionOk(!!data.session);
      if (!data.session) {
        setError('Nenhuma sessao de recuperacao ativa. Solicite um novo link pela pagina de login.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa de no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('Senha alterada com sucesso. Redirecionando...');
      setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <h1 className="text-5xl font-bold font-display text-white tracking-wider">VERELUS</h1>
          </a>
          <p className="text-brand-muted mt-2 text-sm">Music Intelligence Platform</p>
        </div>

        <div className="bg-brand-surface/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-semibold text-white mb-6">Definir nova senha</h2>

          {sessionOk === null && !error && (
            <p className="text-white/60 text-sm mb-4">Validando link de recuperacao...</p>
          )}
          {sessionOk === true && (
            <p className="text-brand-green/70 text-sm mb-4">Link valido. Defina sua nova senha abaixo.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">Nova senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caracteres"
                required
                minLength={6}
                disabled={sessionOk === false}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm text-white/60 mb-1.5">Confirmar senha</label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                minLength={6}
                disabled={sessionOk === false}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 transition-colors disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-3 text-brand-green text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sessionOk !== true}
              className="w-full px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-brand-green/70 hover:text-brand-green text-sm transition-colors">
              Voltar para login
            </a>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          &copy; 2026 Verelus. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
