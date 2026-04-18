'use client';

import { useState } from 'react';
import type { BioInput, BioOutput, Tone, Language } from '@/lib/types/tools';
import { BIO_CHAR_LIMITS } from '@/lib/types/tools';
import { useToast } from '@/lib/use-toast';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { CharCounter } from '@/components/ui/CharCounter';
import { TONE_DESCRIPTIONS } from '@/lib/tool-content';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const TONE_OPTIONS: Array<{ value: Tone; label: string; hint: string }> = [
  { value: 'formal', label: 'Formal', hint: 'profissional, editorial' },
  { value: 'casual', label: 'Casual', hint: 'amigável, próximo' },
  { value: 'poetico', label: 'Poético', hint: 'imagético, metáforas' },
  { value: 'edgy', label: 'Edgy', hint: 'direto, com atitude' },
];

const DEFAULT_INPUT: BioInput = {
  artist_name: '',
  differentiator: '',
  main_achievement: '',
  mood_three_words: '',
  unusual_influence: '',
  direct_influences: '',
  genre: '',
  city: '',
  tone: 'casual',
  language: 'pt',
};

interface BioCardProps {
  platform: keyof BioOutput;
  label: string;
  text: string;
  limit: number;
  onRegenerate: () => void;
  regenerating: boolean;
}

function BioCard({ platform, label, text, limit, onRegenerate, regenerating }: BioCardProps) {
  const toast = useToast();
  const charCount = text.length;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success(`Bio ${label} copiada!`);
  };

  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{label}</h3>
          <div className="mt-0.5">
            <CharCounter current={charCount} max={limit} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg transition"
          >
            copiar
          </button>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="px-3 py-1.5 text-xs bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg transition disabled:opacity-50"
          >
            {regenerating ? 'gerando...' : 'regenerar'}
          </button>
        </div>
      </div>
      <div className="bg-black/20 rounded-lg p-4 text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </div>
    </div>
  );
}

export function BioClient() {
  const [input, setInput] = useState<BioInput>(DEFAULT_INPUT);
  const [output, setOutput] = useState<BioOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<keyof BioOutput | null>(null);
  const [error, setError] = useState('');

  const update = <K extends keyof BioInput>(key: K, value: BioInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const canSubmit = (
    input.artist_name.trim().length > 0 &&
    input.differentiator.trim().length > 0 &&
    input.main_achievement.trim().length > 0 &&
    input.mood_three_words.trim().length > 0 &&
    input.unusual_influence.trim().length > 0 &&
    input.direct_influences.trim().length > 0
  );

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/bio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const data = (await res.json()) as { output: BioOutput };
      setOutput(data.output);
      // Scroll ao resultado
      setTimeout(() => {
        document.getElementById('bio-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const regenerateOne = async (platform: keyof BioOutput) => {
    if (!output) return;
    setRegeneratingField(platform);
    setError('');
    try {
      const res = await fetch('/api/tools/bio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const data = (await res.json()) as { output: BioOutput };
      // Substitui apenas a plataforma pedida
      setOutput({ ...output, [platform]: data.output[platform] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setRegeneratingField(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Bio Adaptativa"
          description="Responde 6 perguntas curtas e recebe 4 bios profissionais otimizadas pra Spotify, Instagram, EPK e Twitter. Cada uma no tamanho exato e tom da plataforma."
          icon={<ToolIcon tool="bio" size={22} />}
          accent="green"
        />

        <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-5">
          <Field label="Nome artístico" required>
            <input
              type="text"
              value={input.artist_name}
              onChange={(e) => update('artist_name', e.target.value)}
              placeholder="Ex: Ana Frango Elétrico"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
            />
          </Field>

          <Field label="Em 2 frases, o que te diferencia de outros artistas?" required hint="Algo concreto, não 'sou único'. Ex: instrumentação, temática, origem, abordagem">
            <textarea
              value={input.differentiator}
              onChange={(e) => update('differentiator', e.target.value)}
              rows={3}
              placeholder="Ex: Combino samba-funk dos anos 70 com produção eletrônica. Letras sobre periferia de BH com humor."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 resize-none"
            />
          </Field>

          <Field label="Conquista mais significativa até hoje" required hint="Show relevante, indicação, número de streams marcante, colaboração, prêmio">
            <input
              type="text"
              value={input.main_achievement}
              onChange={(e) => update('main_achievement', e.target.value)}
              placeholder="Ex: Abri show do Tulipa Ruiz no Sesc Pompeia em 2024"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
            />
          </Field>

          <Field label="Em 3 palavras, o mood da sua música" required>
            <input
              type="text"
              value={input.mood_three_words}
              onChange={(e) => update('mood_three_words', e.target.value)}
              placeholder="Ex: melancólica, urgente, cinemática"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
            />
          </Field>

          <Field label="Uma influência não-óbvia que te inspira" required hint="Um artista, cineasta, autor, arquiteto — qualquer referência fora do seu gênero óbvio. Ex: Wong Kar-wai, Clarice Lispector, Arvo Pärt">
            <input
              type="text"
              value={input.unusual_influence}
              onChange={(e) => update('unusual_influence', e.target.value)}
              placeholder="Ex: Wong Kar-wai / Clarice Lispector / Arvo Part"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
            />
          </Field>

          <Field label="2-3 influências musicais diretas" required hint="Artistas que compartilham algo com sua música">
            <input
              type="text"
              value={input.direct_influences}
              onChange={(e) => update('direct_influences', e.target.value)}
              placeholder="Ex: Juçara Marçal, Sessa, Tim Bernardes"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Gênero (opcional)">
              <input
                type="text"
                value={input.genre ?? ''}
                onChange={(e) => update('genre', e.target.value)}
                placeholder="Ex: indie rock, MPB"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            </Field>
            <Field label="Cidade (opcional)">
              <input
                type="text"
                value={input.city ?? ''}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Ex: Belo Horizonte"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            </Field>
          </div>

          <Field label="Tom desejado">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('tone', opt.value)}
                  className={`px-3 py-3 rounded-lg border text-left transition ${
                    input.tone === opt.value
                      ? 'border-brand-green bg-brand-green/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {opt.label}
                    <HelpTooltip content={TONE_DESCRIPTIONS[opt.value]} />
                  </div>
                  <div className="text-xs text-brand-muted mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Idioma">
            <div className="grid grid-cols-2 gap-2">
              {(['pt', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => update('language', lang)}
                  className={`px-3 py-3 rounded-lg border font-semibold transition ${
                    input.language === lang
                      ? 'border-brand-green bg-brand-green/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                  }`}
                >
                  {lang === 'pt' ? 'Português' : 'Inglês'}
                </button>
              ))}
            </div>
          </Field>

          {error && <ErrorMessage message={error} />}

          <button
            onClick={generate}
            disabled={!canSubmit || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Gerando suas 4 bios...' : 'Gerar bios'}
          </button>
          {!canSubmit && (
            <p className="text-xs text-brand-muted text-center">
              Preencha todos os campos obrigatórios pra liberar
            </p>
          )}
        </div>

        {output && (
          <div id="bio-results" className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-2">Suas bios</h2>
              <button
                onClick={() => setOutput(null)}
                className="text-xs font-mono uppercase tracking-wider text-brand-muted hover:text-white transition-colors"
              >
                + Novo
              </button>
            </div>
            <p className="text-brand-muted mb-6 text-sm">
              Cada uma foi escrita especificamente pra sua plataforma. Regenera individualmente se não gostou de alguma.
            </p>
            <BioCard
              platform="spotify"
              label="Spotify"
              text={output.spotify}
              limit={BIO_CHAR_LIMITS.spotify}
              onRegenerate={() => regenerateOne('spotify')}
              regenerating={regeneratingField === 'spotify'}
            />
            <BioCard
              platform="instagram"
              label="Instagram"
              text={output.instagram}
              limit={BIO_CHAR_LIMITS.instagram}
              onRegenerate={() => regenerateOne('instagram')}
              regenerating={regeneratingField === 'instagram'}
            />
            <BioCard
              platform="epk"
              label="EPK / Press"
              text={output.epk}
              limit={BIO_CHAR_LIMITS.epk}
              onRegenerate={() => regenerateOne('epk')}
              regenerating={regeneratingField === 'epk'}
            />
            <BioCard
              platform="twitter"
              label="Twitter / X"
              text={output.twitter}
              limit={BIO_CHAR_LIMITS.twitter}
              onRegenerate={() => regenerateOne('twitter')}
              regenerating={regeneratingField === 'twitter'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1">
        {label} {required && <span className="text-brand-green">*</span>}
      </label>
      {hint && <p className="text-xs text-brand-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}
