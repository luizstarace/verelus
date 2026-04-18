'use client';

import { useState } from 'react';
import type { RiderInput, StageTemplate, MusicianSpec, StageItem, StageItemType } from '@/lib/types/tools';
import { STAGE_TEMPLATES } from '@/lib/types/tools';
import { StagePlotEditor } from '@/components/rider/StagePlotEditor';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeItem(type: StageItemType, x: number, y: number, label?: string): StageItem {
  return { id: genId(), type, x, y, label };
}

// Presets de layout visual por template (posicoes {x, y} em 0-1, y=0 e frente/publico)
const STAGE_ITEM_PRESETS: Partial<Record<StageTemplate, StageItem[]>> = {
  solo_acoustic: [
    makeItem('vocal_mic', 0.5, 0.35, 'Vocal'),
    makeItem('acoustic_guitar', 0.62, 0.45, 'Violão'),
    makeItem('monitor', 0.42, 0.22),
    makeItem('di_box', 0.7, 0.55),
  ],
  solo_electric: [
    makeItem('vocal_mic', 0.5, 0.35, 'Vocal'),
    makeItem('guitar_stand', 0.62, 0.45, 'Guitarra'),
    makeItem('guitar_amp', 0.7, 0.7),
    makeItem('monitor', 0.42, 0.22),
  ],
  duo: [
    makeItem('vocal_mic', 0.38, 0.35, 'Vocal 1'),
    makeItem('vocal_mic', 0.62, 0.35, 'Vocal 2'),
    makeItem('monitor', 0.3, 0.22),
    makeItem('monitor', 0.7, 0.22),
  ],
  power_trio: [
    makeItem('vocal_mic', 0.3, 0.4, 'Vocal guit'),
    makeItem('guitar_stand', 0.22, 0.5, 'Guitarra'),
    makeItem('guitar_amp', 0.15, 0.75),
    makeItem('vocal_mic', 0.7, 0.4, 'Vocal baixo'),
    makeItem('bass_stand', 0.78, 0.5, 'Baixo'),
    makeItem('bass_amp', 0.85, 0.75),
    makeItem('drum_kit', 0.5, 0.72, 'Bateria'),
    makeItem('monitor', 0.2, 0.22),
    makeItem('monitor', 0.5, 0.22),
    makeItem('monitor', 0.8, 0.22),
  ],
  quartet: [
    makeItem('vocal_mic', 0.5, 0.35, 'Vocal'),
    makeItem('guitar_stand', 0.25, 0.45, 'Guitarra'),
    makeItem('guitar_amp', 0.18, 0.72),
    makeItem('bass_stand', 0.75, 0.45, 'Baixo'),
    makeItem('bass_amp', 0.82, 0.72),
    makeItem('drum_kit', 0.5, 0.7, 'Bateria'),
    makeItem('monitor', 0.25, 0.2),
    makeItem('monitor', 0.5, 0.2),
    makeItem('monitor', 0.75, 0.2),
  ],
  five_piece: [
    makeItem('vocal_mic', 0.5, 0.35, 'Vocal'),
    makeItem('keyboard', 0.22, 0.45, 'Teclado'),
    makeItem('guitar_stand', 0.38, 0.45, 'Guitarra'),
    makeItem('guitar_amp', 0.35, 0.72),
    makeItem('bass_stand', 0.62, 0.45, 'Baixo'),
    makeItem('bass_amp', 0.65, 0.72),
    makeItem('drum_kit', 0.78, 0.7, 'Bateria'),
    makeItem('monitor', 0.2, 0.2),
    makeItem('monitor', 0.4, 0.2),
    makeItem('monitor', 0.6, 0.2),
    makeItem('monitor', 0.8, 0.2),
  ],
  six_plus: [
    makeItem('vocal_mic', 0.4, 0.35, 'Vocal 1'),
    makeItem('vocal_mic', 0.6, 0.35, 'Vocal 2'),
    makeItem('keyboard', 0.2, 0.45, 'Teclado'),
    makeItem('guitar_stand', 0.35, 0.5, 'Guitarra'),
    makeItem('guitar_amp', 0.3, 0.75),
    makeItem('bass_stand', 0.62, 0.5, 'Baixo'),
    makeItem('bass_amp', 0.68, 0.75),
    makeItem('drum_kit', 0.5, 0.7, 'Bateria'),
    makeItem('monitor', 0.2, 0.18),
    makeItem('monitor', 0.4, 0.18),
    makeItem('monitor', 0.6, 0.18),
    makeItem('monitor', 0.8, 0.18),
  ],
  dj_setup: [
    makeItem('custom_label', 0.5, 0.4, 'Setup DJ'),
    makeItem('vocal_mic', 0.35, 0.3, 'Mic DJ'),
    makeItem('monitor', 0.3, 0.18),
    makeItem('monitor', 0.7, 0.18),
    makeItem('power_outlet', 0.6, 0.5),
  ],
};

const DEFAULT_MUSICIAN: MusicianSpec = {
  role: '',
  instrument: '',
  needs_mic: true,
  needs_monitor: true,
  needs_di: false,
  notes: '',
};

const TEMPLATE_PRESETS: Partial<Record<StageTemplate, MusicianSpec[]>> = {
  solo_acoustic: [
    { role: 'Vocal + violão', instrument: 'Violão aço + voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: true },
  ],
  solo_electric: [
    { role: 'Vocal + guitarra', instrument: 'Guitarra elétrica + voz', needs_mic: true, needs_monitor: true, needs_di: true },
  ],
  duo: [
    { role: 'Vocal 1', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
    { role: 'Vocal 2', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
  ],
  power_trio: [
    { role: 'Guitarra + vocal', instrument: 'Guitarra elétrica + voz', needs_mic: true, needs_monitor: true, needs_di: true },
    { role: 'Baixo', instrument: 'Baixo elétrico', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Bateria', instrument: 'Bateria 5 peças', needs_mic: true, needs_monitor: true, needs_di: false },
  ],
  quartet: [
    { role: 'Vocal', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
    { role: 'Guitarra', instrument: 'Guitarra elétrica', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Baixo', instrument: 'Baixo elétrico', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Bateria', instrument: 'Bateria 5 peças', needs_mic: true, needs_monitor: true, needs_di: false },
  ],
  five_piece: [
    { role: 'Vocal', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
    { role: 'Guitarra 1', instrument: 'Guitarra elétrica', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Guitarra 2 / Tecladista', instrument: 'Guitarra ou teclado', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Baixo', instrument: 'Baixo elétrico', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Bateria', instrument: 'Bateria 5 peças', needs_mic: true, needs_monitor: true, needs_di: false },
  ],
  six_plus: [
    { role: 'Vocal principal', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
    { role: 'Vocal backing', instrument: 'Voz (SM58)', needs_mic: true, needs_monitor: true, needs_di: false },
    { role: 'Guitarra', instrument: 'Guitarra elétrica', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Baixo', instrument: 'Baixo elétrico', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Teclado', instrument: 'Teclado stereo', needs_mic: false, needs_monitor: true, needs_di: true },
    { role: 'Bateria', instrument: 'Bateria 5 peças', needs_mic: true, needs_monitor: true, needs_di: false },
  ],
  dj_setup: [
    { role: 'DJ', instrument: 'Controladora / CDJ', needs_mic: false, needs_monitor: true, needs_di: false, notes: 'Precisa de mesa 2m mínimo' },
  ],
};

const DEFAULT_INPUT: RiderInput = {
  artist_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  stage_template: 'power_trio',
  musicians: TEMPLATE_PRESETS.power_trio!,
  stage_items: STAGE_ITEM_PRESETS.power_trio ?? [],
  pa_minimum_watts: 2000,
  lighting: 'basic',
  lighting_notes: '',
  soundcheck_minutes: 60,
  dressing_room: true,
  meals_needed: true,
  meals_count: 3,
  accommodation: false,
  accommodation_details: '',
  transport_notes: '',
  special_technical_notes: '',
};

export function RiderClient() {
  const [input, setInput] = useState<RiderInput>(DEFAULT_INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ pdfBlob: Blob; shareId: string | null } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const update = <K extends keyof RiderInput>(key: K, value: RiderInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const selectTemplate = (template: StageTemplate) => {
    const preset = TEMPLATE_PRESETS[template] ?? [{ ...DEFAULT_MUSICIAN }];
    const stagePreset = STAGE_ITEM_PRESETS[template] ?? [];
    setInput({
      ...input,
      stage_template: template,
      musicians: preset.map((m) => ({ ...m })),
      stage_items: stagePreset.map((i) => ({ ...i, id: genId() })),
    });
  };

  const updateMusician = (index: number, changes: Partial<MusicianSpec>) => {
    const updated = [...input.musicians];
    updated[index] = { ...updated[index], ...changes };
    setInput({ ...input, musicians: updated });
  };

  const addMusician = () => {
    setInput({ ...input, musicians: [...input.musicians, { ...DEFAULT_MUSICIAN }] });
  };

  const removeMusician = (index: number) => {
    if (input.musicians.length <= 1) return;
    const updated = input.musicians.filter((_, i) => i !== index);
    setInput({ ...input, musicians: updated });
  };

  const canSubmit =
    input.artist_name.trim().length > 0 &&
    input.contact_name.trim().length > 0 &&
    input.contact_email.trim().length > 0 &&
    input.contact_phone.trim().length > 0 &&
    input.musicians.every((m) => m.role.trim() && m.instrument.trim());

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/tools/rider/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      const data = (await res.json()) as { pdf_base64: string; share_id: string | null };
      const binary = Uint8Array.from(atob(data.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([binary], { type: 'application/pdf' });
      setResult({ pdfBlob: blob, shareId: data.share_id });
      setTimeout(() => document.getElementById('rider-result')?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rider-${input.artist_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = async () => {
    if (!result?.shareId) return;
    const url = `${window.location.origin}/api/rider/${result.shareId}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Rider Técnico"
          description="Responda sobre a banda e o setup. Geramos um PDF profissional com diagrama de palco, lista de instrumentos, rider pessoal e observações. Pronto pra enviar pra produção."
          icon={<ToolIcon tool="rider" size={22} />}
          accent="green"
        />

        <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-6">
          {/* ----------- CONTATO ----------- */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">1. Contato da produção</h2>
            <Field label="Nome artístico / banda" required>
              <TextInput value={input.artist_name} onChange={(v) => update('artist_name', v)} placeholder="Ex: Ana Frango Elétrico" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Responsável" required>
                <TextInput value={input.contact_name} onChange={(v) => update('contact_name', v)} placeholder="Nome de quem cuida da produção" />
              </Field>
              <Field label="Telefone" required>
                <TextInput value={input.contact_phone} onChange={(v) => update('contact_phone', v)} placeholder="(11) 99999-9999" />
              </Field>
            </div>
            <Field label="E-mail" required>
              <TextInput type="email" value={input.contact_email} onChange={(v) => update('contact_email', v)} placeholder="producao@seuartista.com" />
            </Field>
          </section>

          {/* ----------- FORMATO ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white">2. Formato da banda</h2>
            <p className="text-xs text-brand-muted">Escolha o formato mais próximo. Populamos os músicos automaticamente — você ajusta depois.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(STAGE_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTemplate(key as StageTemplate)}
                  className={`px-3 py-3 rounded-xl border text-left transition ${
                    input.stage_template === key
                      ? 'border-brand-green bg-brand-green/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className="text-xs text-brand-muted mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* ----------- MUSICOS ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">3. Músicos e instrumentação</h2>
              <button
                type="button"
                onClick={addMusician}
                className="text-xs px-3 py-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg"
              >
                + Adicionar músico
              </button>
            </div>
            {input.musicians.map((m, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase text-brand-muted font-mono">Músico {i + 1}</div>
                  {input.musicians.length > 1 && (
                    <button type="button" onClick={() => removeMusician(i)} className="text-xs text-red-400 hover:text-red-300">
                      remover
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Função / Role">
                    <TextInput value={m.role} onChange={(v) => updateMusician(i, { role: v })} placeholder="Ex: Vocal principal" />
                  </Field>
                  <Field label="Instrumento">
                    <TextInput value={m.instrument} onChange={(v) => updateMusician(i, { instrument: v })} placeholder="Ex: Voz + SM58" />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Checkbox label="Precisa microfone" checked={m.needs_mic} onChange={(v) => updateMusician(i, { needs_mic: v })} />
                  <Checkbox label="Precisa monitor" checked={m.needs_monitor} onChange={(v) => updateMusician(i, { needs_monitor: v })} />
                  <Checkbox label="Precisa DI" checked={m.needs_di} onChange={(v) => updateMusician(i, { needs_di: v })} />
                </div>
                <Field label="Observações (opcional)">
                  <TextInput value={m.notes ?? ''} onChange={(v) => updateMusician(i, { notes: v })} placeholder="Pedaleira, amp específico, etc." />
                </Field>
              </div>
            ))}
          </section>

          {/* ----------- MAPA DE PALCO ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white">4. Mapa de palco</h2>
            <p className="text-xs text-brand-muted">
              Posicione cada equipamento como vai ficar no palco. Clique num item da paleta pra adicionar, arraste pra reposicionar, clique pra editar o rótulo. O preset foi montado baseado no seu template — ajuste como quiser.
            </p>
            <StagePlotEditor
              items={input.stage_items ?? []}
              onChange={(items) => update('stage_items', items)}
            />
          </section>

          {/* ----------- SOM E ILUMINACAO ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white">5. Som e iluminação</h2>
            <Field label="Potência mínima de PA (watts)" hint="Regra geral: 10W por pessoa no público. Ex: 200 pessoas = 2000w">
              <input
                type="number"
                value={input.pa_minimum_watts}
                onChange={(e) => update('pa_minimum_watts', Number(e.target.value))}
                min={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </Field>
            <Field label="Iluminação">
              <div className="grid grid-cols-3 gap-2">
                {(['basic', 'scenic', 'custom'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update('lighting', l)}
                    className={`px-3 py-3 rounded-xl border font-semibold text-sm transition ${
                      input.lighting === l
                        ? 'border-brand-green bg-brand-green/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {l === 'basic' ? 'Básica' : l === 'scenic' ? 'Cênica' : 'Customizada'}
                  </button>
                ))}
              </div>
            </Field>
            {input.lighting !== 'basic' && (
              <Field label="Detalhes da iluminação">
                <TextInput value={input.lighting_notes ?? ''} onChange={(v) => update('lighting_notes', v)} placeholder="Ex: 4 lights móvel, nevoeiro, cores quentes" />
              </Field>
            )}
            <Field label="Passagem de som mínima (minutos)">
              <div className="grid grid-cols-4 gap-2">
                {([30, 60, 90, 120] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update('soundcheck_minutes', m)}
                    className={`px-3 py-3 rounded-xl border font-semibold text-sm transition ${
                      input.soundcheck_minutes === m
                        ? 'border-brand-green bg-brand-green/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {m}min
                  </button>
                ))}
              </div>
            </Field>
          </section>

          {/* ----------- RIDER PESSOAL ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white">6. Rider pessoal</h2>
            <div className="flex flex-wrap gap-6">
              <Checkbox label="Precisa de camarim" checked={input.dressing_room} onChange={(v) => update('dressing_room', v)} />
              <Checkbox label="Precisa de refeições" checked={input.meals_needed} onChange={(v) => update('meals_needed', v)} />
              <Checkbox label="Precisa de hospedagem" checked={input.accommodation} onChange={(v) => update('accommodation', v)} />
            </div>
            {input.meals_needed && (
              <Field label="Quantas refeições?">
                <input
                  type="number"
                  value={input.meals_count}
                  onChange={(e) => update('meals_count', Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
                />
              </Field>
            )}
            {input.accommodation && (
              <Field label="Detalhes da hospedagem">
                <TextInput value={input.accommodation_details ?? ''} onChange={(v) => update('accommodation_details', v)} placeholder="Ex: 3 quartos single, check-in cedo" />
              </Field>
            )}
            <Field label="Transporte (opcional)" hint="Ex: transfer aeroporto, van local">
              <TextInput value={input.transport_notes ?? ''} onChange={(v) => update('transport_notes', v)} placeholder="Detalhes de transporte, se necessário" />
            </Field>
          </section>

          {/* ----------- OBSERVACOES ----------- */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white">7. Observações especiais</h2>
            <Field label="Qualquer coisa que não cabe nos campos acima" hint="Sintetizadores custom, equipamento raro, protocolos específicos, etc.">
              <textarea
                value={input.special_technical_notes ?? ''}
                onChange={(e) => update('special_technical_notes', e.target.value)}
                rows={3}
                placeholder="Deixe em branco se não tiver"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 resize-none"
              />
            </Field>
          </section>

          {error && <ErrorMessage message={error} />}

          <button
            onClick={() => setShowPreview(true)}
            disabled={!canSubmit || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl disabled:opacity-50 transition"
          >
            {loading ? 'Gerando PDF...' : 'Gerar Rider'}
          </button>
          {!canSubmit && (
            <p className="text-xs text-brand-muted text-center">
              Preencha nome, contato e dados dos músicos pra liberar
            </p>
          )}
        </div>

        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
            <div className="relative bg-brand-surface border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Preview do Rider</h3>
              <p className="text-sm text-brand-muted mb-4">
                Revise as informações antes de gerar o PDF. Depois de gerado, alterações exigem um novo arquivo.
              </p>
              <div className="text-sm text-white/80 space-y-2 mb-6 bg-black/30 rounded-lg p-4">
                <p><strong>Artista:</strong> {input.artist_name || '—'}</p>
                <p><strong>Contato:</strong> {input.contact_name || '—'} ({input.contact_email || '—'}, {input.contact_phone || '—'})</p>
                <p><strong>Formato:</strong> {STAGE_TEMPLATES[input.stage_template].label}</p>
                <p><strong>Músicos:</strong> {input.musicians?.length ?? 0}</p>
                <p><strong>Equipamentos no palco:</strong> {input.stage_items?.length ?? 0}</p>
                <p><strong>PA mínimo:</strong> {input.pa_minimum_watts}w</p>
                <p><strong>Iluminação:</strong> {input.lighting === 'basic' ? 'Básica' : input.lighting === 'scenic' ? 'Cênica' : 'Customizada'}</p>
                <p><strong>Passagem de som:</strong> {input.soundcheck_minutes} min</p>
                <p><strong>Camarim:</strong> {input.dressing_room ? 'Sim' : 'Não'} | <strong>Refeições:</strong> {input.meals_needed ? `Sim (${input.meals_count})` : 'Não'} | <strong>Hospedagem:</strong> {input.accommodation ? 'Sim' : 'Não'}</p>
                {input.special_technical_notes && <p><strong>Observações:</strong> {input.special_technical_notes}</p>}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-white/10 text-white/60 rounded-lg hover:text-white hover:border-white/20 text-sm"
                >
                  Voltar e editar
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPreview(false); void generate(); }}
                  className="px-4 py-2 bg-brand-green text-black font-bold rounded-lg hover:brightness-110 text-sm"
                >
                  Gerar PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div id="rider-result" className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Seu rider está pronto</h2>
            <div className="bg-brand-surface rounded-2xl border border-white/10 overflow-hidden">
              <iframe
                src={URL.createObjectURL(result.pdfBlob)}
                className="w-full min-h-[50vh] h-[600px] bg-white"
                title="Preview do Rider"
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={downloadPdf}
                className="px-5 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-semibold rounded-xl"
              >
                Baixar PDF
              </button>
              {result.shareId && (
                <button
                  onClick={copyShareLink}
                  className="px-5 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5"
                >
                  Copiar link compartilhável
                </button>
              )}
              <button
                onClick={() => setResult(null)}
                className="px-5 py-3 text-white/60 hover:text-white rounded-xl"
              >
                Editar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Helpers de UI -----

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

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
    />
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-brand-green"
      />
      <span className="text-sm text-white/80">{label}</span>
    </label>
  );
}
