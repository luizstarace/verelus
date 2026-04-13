'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = getSupabase();
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth/callback',
          },
        });
        if (signUpError) throw signUpError;
        setMessage('Verifique seu email para confirmar o cadastro.');
      } else if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth/callback?next=/auth/reset',
        });
        if (resetError) throw resetError;
        setMessage('Email de recuperacao enviado. Verifique sua caixa de entrada.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <h1 className="text-5xl font-bold font-display text-white tracking-wider">VERELUS</h1>
          </a>
          <p className="text-brand-muted mt-2 text-sm">Music Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-semibold text-white mb-6">
            {mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Recuperar senha' : 'Entrar'}
          </h2>

          {/* Google OAuth */}
          {mode !== 'reset' && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>
          )}

          {mode !== 'reset' && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-sm">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 transition-colors"
              />
            </div>
            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm text-white/60">Senha</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                      className="text-xs text-brand-green/70 hover:text-brand-green transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Crie uma senha (min. 6 caracteres)' : 'Sua senha'}
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 transition-colors"
                />
              </div>
            )}

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
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-green/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar email de recuperacao' : 'Entrar'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'reset' ? (
              <button
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                className="text-brand-green/70 hover:text-brand-green text-sm transition-colors"
              >
                Voltar para login
              </button>
            ) : (
              <button
                onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage(''); }}
                className="text-brand-green/70 hover:text-brand-green text-sm transition-colors"
              >
                {mode === 'signup' ? 'Já tem conta? Entre aqui' : 'Novo por aqui? Crie sua conta'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-8">
          &copy; 2026 Verelus. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
