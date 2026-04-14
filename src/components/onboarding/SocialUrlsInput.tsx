'use client';

interface SocialUrls {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

interface Props {
  value: SocialUrls;
  onChange: (v: SocialUrls) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SocialUrlsInput({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Redes sociais</h2>
      <p className="text-brand-muted mb-6">Opcional. Informe suas redes ativas (minimo 1 recomendado).</p>
      {(['instagram', 'tiktok', 'youtube'] as const).map((key) => (
        <div key={key} className="mb-4">
          <label className="block text-sm text-white/60 mb-1 capitalize">{key}</label>
          <input
            type="url"
            placeholder={`https://${key}.com/seuperfil`}
            value={value[key] ?? ''}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
          />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl">Voltar</button>
        <button onClick={onNext} className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl">Continuar</button>
      </div>
    </div>
  );
}
