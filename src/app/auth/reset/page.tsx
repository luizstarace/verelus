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
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-brand-text tracking-tight">Verelus</h1>
          </a>
          <p className="text-brand-muted mt-2 text-sm">Produtos com IA para o seu negócio</p>
        </div>

        <div className="bg-white shadow-xl border border-brand-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-brand-text mb-6">Definir nova senha</h2>

          {sessionOk === null && !error && (
            <p className="text-brand-muted text-sm mb-4">Validando link de recuperacao...</p>
          )}
          {sessionOk === true && (
            <p className="text-brand-trust text-sm mb-4">Link valido. Defina sua nova senha abaixo.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-brand-text text-sm font-medium mb-1.5">Nova senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caracteres"
                required
                minLength={6}
                disabled={sessionOk === false}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust/20 focus:border-brand-trust transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-brand-text text-sm font-medium mb-1.5">Confirmar senha</label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                minLength={6}
                disabled={sessionOk === false}
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-trust/20 focus:border-brand-trust transition-colors disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-brand-error/10 border border-brand-error/20 rounded-xl p-3 text-brand-error text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-brand-trust/10 border border-brand-trust/20 rounded-xl p-3 text-brand-trust text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sessionOk !== true}
              className="w-full px-4 py-3 bg-brand-cta text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-brand-trust hover:text-brand-trust text-sm transition-colors">
              Voltar para login
            </a>
          </div>
        </div>

        <p className="text-center text-brand-muted text-xs mt-8">
          &copy; 2026 Verelus. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
