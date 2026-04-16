'use client';

import { useState } from 'react';
import type { PitchInput, PitchOutput, PitchRecipientType, PitchTone, PitchLanguage } from '@/lib/types/tools';
import { PITCH_RECIPIENT_META } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const DEFAULT_INPUT: PitchInput = {
  artist_name: '',
  song_spotify_url: '',
  song_title: '',
  genre_primary: '',
  mood_keywords: '',
  release_type: 'single',
  release_date: '',
  achievements: '',
  similar_artists: '',
  recipient_type: 'playlist_curator_indie',
  recipient_name: '',
  recipient_entity: '',
  tone: 'professional',
  language: 'pt',
};

const TONE_OPTIONS: Array<{ v: PitchTone; label: string; desc: string }> = [
  { v: 'professional', label: 'Profissional', desc: 'polido, editorial' },
  { v: 'casual', label: 'Casual', desc: 'direto, proximo' },
  { v: 'bold', label: 'Ousado', desc: 'confiante, sem pedir desculpa' },
];

type Tab = 'email' | 'one-pager' | 'press';

export function PitchKitClient() {
  const [input, setInput] = useState<PitchInput>(DEFAULT_INPUT);
  const [output, setOutput] = useState<PitchOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('email');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const update = <K extends keyof PitchInput>(key: K, value: PitchInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const updateOutput = (patch: Partial<PitchOutput>) => {
    if (!output) return;
    setOutput({ ...output, ...patch });
  };

  const canSubmit = (
    input.artist_name.trim() &&
    input.song_title.trim() &&
    input.genre_primary.trim() &&
    input.mood_keywords.trim() &&
    input.achievements.trim() &&
    input.similar_artists.trim() &&
    input.recipient_name.trim() &&
    input.recipient_entity.trim()
  );

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/pitch-kit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const data = (await res.json()) as { output: PitchOutput };
      setOutput(data.output);
      setActiveTab('email');
      setTimeout(() => document.getElementById('pitch-result')?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  const downloadOnePager = async () => {
    if (!output) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/tools/pitch-kit/one-pager-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, output }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const data = (await res.json()) as { pdf_base64: string };
      const binary = Uint8Array.from(atob(data.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([binary], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1-pager-${input.artist_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Pitch Kit"
          description="Voce informa pra quem vai enviar e sua musica. Sai com email + 1-pager + press release coordenados, prontos pra copiar e enviar."
          icon={<ToolIcon tool="pitch-kit" size={22} />}
          accent="purple"
        />

        <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-6">
          {/* ----- Sobre a musica ----- */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Sobre voce e a musica</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome artistico" required>
                <TextInput value={input.artist_name} onChange={(v) => update('artist_name', v)} placeholder="Ex: Ana Frango Eletrico" />
              </Field>
              <Field label="Titulo da musica/release" required>
                <TextInput value={input.song_title} onChange={(v) => update('song_title', v)} placeholder="Ex: Tem Certeza" />
              </Field>
            </div>
            <Field label="URL Spotify da musica (opcional)" hint="Se informar, o pitch fica mais forte (curador ja tem link)">
              <TextInput value={input.song_spotify_url ?? ''} onChange={(v) => update('song_spotify_url', v)} placeholder="https://open.spotify.com/track/..." />
            </Field>
            <Field label="Tipo">
              <div className="grid grid-cols-3 gap-2">
                {(['single', 'ep', 'album'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('release_type', t)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition uppercase ${
                      input.release_type === t ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Genero primario" required>
                <TextInput value={input.genre_primary} onChange={(v) => update('genre_primary', v)} placeholder="Ex: indie pop, MPB, trap" />
              </Field>
              <Field label="Mood em 3 palavras" required>
                <TextInput value={input.mood_keywords} onChange={(v) => update('mood_keywords', v)} placeholder="Ex: melancolica, urgente, cinematica" />
              </Field>
            </div>
            <Field label="Data de lancamento (opcional)" hint="Deixe vazio se ainda nao lancou (pitch pre-release)">
              <input
                type="date"
                value={input.release_date ?? ''}
                onChange={(e) => update('release_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </Field>
          </section>

          {/* ----- Credibilidade ----- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Credibilidade</h2>
            <Field label="2-3 conquistas recentes" required hint="Seja especifico. Numeros, shows, imprensa, colaboracoes.">
              <textarea
                value={input.achievements}
                onChange={(e) => update('achievements', e.target.value)}
                rows={3}
                placeholder="Ex: 35k ouvintes mensais no Spotify, abri show do X no Sesc Pompeia em 2024, entrevista na revista Y"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 resize-none"
              />
            </Field>
            <Field label="2-3 artistas similares" required hint="Ajuda o destinatario a situar sua musica rapido">
              <TextInput value={input.similar_artists} onChange={(v) => update('similar_artists', v)} placeholder="Ex: Sessa, Tim Bernardes, Jucara Marcal" />
            </Field>
          </section>

          {/* ----- Destinatario ----- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Para quem voce vai enviar</h2>
            <Field label="Tipo de destinatario">
              <select
                value={input.recipient_type}
                onChange={(e) => update('recipient_type', e.target.value as PitchRecipientType)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              >
                {(Object.keys(PITCH_RECIPIENT_META) as PitchRecipientType[]).map((k) => (
                  <option key={k} value={k} className="bg-brand-surface">
                    {PITCH_RECIPIENT_META[k].label} — {PITCH_RECIPIENT_META[k].description}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome do destinatario" required>
                <TextInput value={input.recipient_name} onChange={(v) => update('recipient_name', v)} placeholder="Ex: Ana Silva" />
              </Field>
              <Field label="Entidade/veiculo" required>
                <TextInput value={input.recipient_entity} onChange={(v) => update('recipient_entity', v)} placeholder="Ex: Playlist Indie BR" />
              </Field>
            </div>
          </section>

          {/* ----- Tom e idioma ----- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Estilo</h2>
            <Field label="Tom">
              <div className="grid grid-cols-3 gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => update('tone', t.v)}
                    className={`px-3 py-3 rounded-xl border text-left transition ${
                      input.tone === t.v ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Idioma">
              <div className="grid grid-cols-2 gap-2">
                {(['pt', 'en'] as PitchLanguage[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update('language', l)}
                    className={`px-3 py-3 rounded-xl border font-semibold transition ${
                      input.language === l ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {l === 'pt' ? 'Portugues' : 'Ingles'}
                  </button>
                ))}
              </div>
            </Field>
          </section>

          {error && <ErrorMessage message={error} />}

          <button
            onClick={generate}
            disabled={!canSubmit || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-bold rounded-xl disabled:opacity-50 transition"
          >
            {loading ? 'Gerando pitch kit...' : 'Gerar pitch kit'}
          </button>
          {!canSubmit && (
            <p className="text-xs text-brand-muted text-center">Preencha os campos obrigatorios pra liberar</p>
          )}
        </div>

        {/* ========== RESULTADO ========== */}
        {output && (
          <div id="pitch-result" className="mt-12 space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Seu pitch kit</h2>
              <p className="text-sm text-brand-muted">
                3 pecas coordenadas. Clica na aba pra ver cada uma, edite se quiser, copia e envia.
              </p>
            </div>

            {/* Tabs */}
            <div role="tablist" className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
              {([
                { v: 'email', label: 'Email frio' },
                { v: 'one-pager', label: '1-Pager' },
                { v: 'press', label: 'Press Release' },
              ] as const).map((t) => (
                <button
                  key={t.v}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.v}
                  onClick={() => setActiveTab(t.v)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === t.v ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Email */}
            {activeTab === 'email' && (
              <div className="bg-brand-surface rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-brand-muted font-mono">Assunto</span>
                    <button
                      onClick={() => copy('subject', output.email_subject)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                    >
                      {copiedSection === 'subject' ? 'copiado!' : 'copiar'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={output.email_subject}
                    onChange={(e) => updateOutput({ email_subject: e.target.value })}
                    className="w-full bg-transparent text-white font-semibold text-lg focus:outline-none"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-brand-muted font-mono">Corpo</span>
                    <button
                      onClick={() => copy('body', output.email_body)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                    >
                      {copiedSection === 'body' ? 'copiado!' : 'copiar'}
                    </button>
                  </div>
                  <textarea
                    value={output.email_body}
                    onChange={(e) => updateOutput({ email_body: e.target.value })}
                    rows={10}
                    className="w-full bg-transparent text-white/90 leading-relaxed resize-none focus:outline-none"
                  />
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => copy('full', `${output.email_subject}\n\n${output.email_body}`)}
                    className="px-4 py-2.5 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-semibold rounded-xl text-sm"
                  >
                    {copiedSection === 'full' ? 'copiado! cole no cliente de email' : 'copiar assunto + corpo'}
                  </button>
                </div>
              </div>
            )}

            {/* One-Pager */}
            {activeTab === 'one-pager' && (
              <div className="bg-brand-surface rounded-2xl border border-white/10 p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-brand-muted font-mono">Hook line</span>
                    <button
                      onClick={() => copy('hook', output.one_pager.hook_line)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                    >
                      {copiedSection === 'hook' ? 'copiado!' : 'copiar'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={output.one_pager.hook_line}
                    onChange={(e) => updateOutput({ one_pager: { ...output.one_pager, hook_line: e.target.value } })}
                    className="w-full bg-transparent text-brand-purple font-bold text-lg focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-brand-muted font-mono">Bio curta</span>
                    <button
                      onClick={() => copy('bio', output.one_pager.short_bio)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                    >
                      {copiedSection === 'bio' ? 'copiado!' : 'copiar'}
                    </button>
                  </div>
                  <textarea
                    value={output.one_pager.short_bio}
                    onChange={(e) => updateOutput({ one_pager: { ...output.one_pager, short_bio: e.target.value } })}
                    rows={4}
                    className="w-full bg-transparent text-white/90 leading-relaxed resize-none focus:outline-none"
                  />
                  <p className="text-[10px] text-brand-muted mt-1 font-mono">{output.one_pager.short_bio.length} caracteres</p>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-brand-muted font-mono block mb-2">Destaques</span>
                  <ul className="space-y-2">
                    {output.one_pager.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-brand-purple mt-0.5 flex-shrink-0">→</span>
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => {
                            const updated = [...output.one_pager.highlights];
                            updated[i] = e.target.value;
                            updateOutput({ one_pager: { ...output.one_pager, highlights: updated } });
                          }}
                          className="flex-1 bg-transparent text-white/90 focus:outline-none"
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={downloadOnePager}
                    disabled={downloadingPdf}
                    className="px-5 py-3 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {downloadingPdf ? 'gerando PDF...' : 'Baixar 1-pager como PDF'}
                  </button>
                </div>
              </div>
            )}

            {/* Press Release */}
            {activeTab === 'press' && (
              <div className="bg-brand-surface rounded-2xl border border-white/10 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-brand-muted font-mono">Press release completo</span>
                  <button
                    onClick={() => copy('press', output.press_release)}
                    className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                  >
                    {copiedSection === 'press' ? 'copiado!' : 'copiar tudo'}
                  </button>
                </div>
                <textarea
                  value={output.press_release}
                  onChange={(e) => updateOutput({ press_release: e.target.value })}
                  rows={18}
                  className="w-full bg-transparent text-white/90 leading-relaxed resize-none focus:outline-none"
                />
                <p className="text-[10px] text-brand-muted font-mono">{output.press_release.length} caracteres</p>
              </div>
            )}
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

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
    />
  );
}
