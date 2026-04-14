'use client';

import { useState } from 'react';
import { parseSpotifyArtistId } from '@/lib/spotify-client';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onNext: () => void;
}

export function SpotifyUrlInput({ value, onChange, onNext }: Props) {
  const [error, setError] = useState('');

  const validate = () => {
    if (!value.trim()) {
      setError('Cole a URL do seu perfil no Spotify');
      return false;
    }
    if (!parseSpotifyArtistId(value)) {
      setError('URL invalida. Exemplo: https://open.spotify.com/artist/...');
      return false;
    }
    setError('');
    return true;
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Conecte seu Spotify</h2>
      <p className="text-brand-muted mb-6">
        Cole a URL do seu perfil de artista no Spotify. Usamos isso para analisar seus dados publicos (ouvintes mensais, catalogo recente).
      </p>
      <input
        type="url"
        placeholder="https://open.spotify.com/artist/..."
        value={value}
        onChange={(e) => { onChange(e.target.value); if (error) setError(''); }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 mb-4"
      />
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button
        onClick={() => { if (validate()) onNext(); }}
        className="w-full px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl"
      >
        Continuar
      </button>
    </div>
  );
}
