'use client';

import { useState } from 'react';
import type { ContractInput, ContractParty } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { CLAUSE_HELP } from '@/lib/tool-content';

const DEFAULT_PARTY: ContractParty = {
  type: 'pf',
  name: '',
  document: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  representative: '',
  representative_document: '',
};

const DEFAULT_INPUT: ContractInput = {
  contractor: { ...DEFAULT_PARTY },
  artist: { ...DEFAULT_PARTY },
  show_date: '',
  show_time: '21:00',
  show_duration_min: 60,
  venue_name: '',
  venue_address: '',
  event_type: 'Show musical em casa de shows',
  has_opening_act: false,
  opening_act_name: '',
  cache_total: 0,
  payment_method: 'pix',
  deposit_percent: 50,
  deposit_due_date: '',
  balance_due_timing: 'on_show_day',
  provides_accommodation: false,
  provides_transport: false,
  provides_meals: true,
  provides_equipment: true,
  provides_security: true,
  provides_promotion: true,
  cancel_fee_less_7_days: 100,
  cancel_fee_7_to_30_days: 50,
  cancel_fee_more_30_days: 20,
  recording_allowed: 'personal_only',
  streaming_allowed: false,
  image_rights_for_promo: true,
  has_exclusivity: false,
  exclusivity_radius_km: 50,
  exclusivity_days_before: 30,
  forum_city: '',
  forum_state: '',
  extra_clauses: '',
};

const STEP_LABELS = ['Partes', 'Show', 'Pagamento', 'Responsabilidades', 'Clausulas', 'Revisao'];

export function ContractClient() {
  const [input, setInput] = useState<ContractInput>(DEFAULT_INPUT);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ pdfBlob: Blob; shareId: string | null } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const update = <K extends keyof ContractInput>(key: K, value: ContractInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const updateParty = (which: 'contractor' | 'artist', field: keyof ContractParty, value: string) => {
    setInput({
      ...input,
      [which]: { ...input[which], [field]: value },
    });
  };

  const updatePartyType = (which: 'contractor' | 'artist', type: 'pf' | 'pj') => {
    setInput({
      ...input,
      [which]: { ...input[which], type },
    });
  };

  const isStepValid = (s: number): boolean => {
    if (s === 0) {
      return [input.contractor, input.artist].every((p) =>
        p.name.trim() && p.document.trim() && p.address_street.trim() &&
        p.address_city.trim() && p.address_state.trim() && p.address_zip.trim()
      );
    }
    if (s === 1) {
      return !!(input.show_date && input.show_time && input.venue_name.trim() && input.venue_address.trim() && input.event_type.trim());
    }
    if (s === 2) {
      return input.cache_total > 0;
    }
    if (s === 3 || s === 4) return true;
    if (s === 5) return !!(input.forum_city.trim() && input.forum_state.trim());
    return true;
  };

  const canGenerate = [0, 1, 2, 5].every((s) => isStepValid(s));

  const next = () => {
    if (!isStepValid(step)) {
      setError('Preencha os campos obrigatorios antes de seguir.');
      return;
    }
    setError('');
    setStep(Math.min(5, step + 1));
  };
  const prev = () => {
    setError('');
    setStep(Math.max(0, step - 1));
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/contract/generate-pdf', {
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
      setTimeout(() => document.getElementById('contract-result')?.scrollIntoView({ behavior: 'smooth' }), 80);
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
    a.download = `contrato-${input.artist.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyShareLink = async () => {
    if (!result?.shareId) return;
    const url = `${window.location.origin}/api/contract/${result.shareId}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Contrato de Show"
          description="6 passos rapidos. Geramos um contrato juridico BR profissional pronto pra assinatura, com disclaimer legal claro."
          icon={<ToolIcon tool="contract" size={22} />}
          accent="green"
        />

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 min-w-[80px] h-1.5 rounded-full transition ${i <= step ? 'bg-brand-green' : 'bg-white/10'}`}
              title={label}
            />
          ))}
        </div>
        <p className="text-xs font-mono uppercase text-brand-muted mb-6 tracking-wider">
          Passo {step + 1} de 6 — {STEP_LABELS[step]}
        </p>

        <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-6">
          {step === 0 && (
            <StepParties input={input} updateParty={updateParty} updatePartyType={updatePartyType} />
          )}
          {step === 1 && (
            <StepShow input={input} update={update} />
          )}
          {step === 2 && (
            <StepPayment input={input} update={update} />
          )}
          {step === 3 && (
            <StepResponsibilities input={input} update={update} />
          )}
          {step === 4 && (
            <StepClauses input={input} update={update} />
          )}
          {step === 5 && (
            <StepReview input={input} update={update} />
          )}

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3 pt-4 border-t border-white/5">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5"
              >
                Voltar
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!canGenerate || loading) return;
                  setShowPreview(true);
                }}
                disabled={!canGenerate || loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl disabled:opacity-50"
              >
                {loading ? 'Gerando PDF...' : 'Gerar contrato'}
              </button>
            )}
          </div>
        </div>

        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
            <div className="relative bg-brand-surface border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Preview do Contrato</h3>
              <p className="text-sm text-brand-muted mb-4">
                Revise os dados antes de gerar o PDF. Depois de gerado, alteracoes exigem um novo arquivo.
              </p>
              <div className="text-sm text-white/80 space-y-2 mb-6 bg-black/30 rounded-lg p-4">
                <p>
                  <strong>Contratante:</strong> {input.contractor.name || '—'}
                  {input.contractor.document ? ` (${input.contractor.document})` : ''}
                </p>
                <p>
                  <strong>Contratado:</strong> {input.artist.name || '—'}
                  {input.artist.document ? ` (${input.artist.document})` : ''}
                </p>
                <p>
                  <strong>Show:</strong> {input.show_date || '—'} as {input.show_time || '—'} ({input.show_duration_min}min)
                </p>
                <p>
                  <strong>Local:</strong> {input.venue_name || '—'}
                  {input.venue_address ? ` — ${input.venue_address}` : ''}
                </p>
                <p>
                  <strong>Valor:</strong> R$ {(input.cache_total / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {' '}({input.deposit_percent}% de sinal, saldo {input.balance_due_timing === 'before_show' ? 'ate 3 dias antes' : input.balance_due_timing === 'on_show_day' ? 'no dia do show' : 'ate 5 dias uteis depois'})
                </p>
                <p>
                  <strong>Multas de cancelamento:</strong> {input.cancel_fee_less_7_days}% (&lt;7d) / {input.cancel_fee_7_to_30_days}% (7-30d) / {input.cancel_fee_more_30_days}% (&gt;30d)
                </p>
                <p>
                  <strong>Foro:</strong> {input.forum_city || '—'}/{input.forum_state || '—'}
                </p>
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
                  onClick={() => {
                    setShowPreview(false);
                    generate();
                  }}
                  className="px-4 py-2 bg-brand-green text-black font-bold rounded-lg hover:brightness-110 text-sm"
                >
                  Gerar PDF agora
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div id="contract-result" className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Seu contrato esta pronto</h2>
            <div className="bg-brand-surface rounded-2xl border border-white/10 overflow-hidden">
              <iframe
                src={URL.createObjectURL(result.pdfBlob)}
                className="w-full min-h-[50vh] h-[700px] bg-white"
                title="Preview do Contrato"
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
                  Copiar link compartilhavel
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

// ==================== STEPS ====================

function StepParties({ input, updateParty, updatePartyType }: {
  input: ContractInput;
  updateParty: (which: 'contractor' | 'artist', field: keyof ContractParty, value: string) => void;
  updatePartyType: (which: 'contractor' | 'artist', type: 'pf' | 'pj') => void;
}) {
  return (
    <div className="space-y-6">
      <PartyForm
        label="CONTRATANTE (quem contrata o show — casa, produtor, festival)"
        party={input.contractor}
        onChange={(field, value) => updateParty('contractor', field, value)}
        onTypeChange={(t) => updatePartyType('contractor', t)}
      />
      <div className="border-t border-white/5" />
      <PartyForm
        label="CONTRATADO (voce / artista / banda)"
        party={input.artist}
        onChange={(field, value) => updateParty('artist', field, value)}
        onTypeChange={(t) => updatePartyType('artist', t)}
      />
    </div>
  );
}

function PartyForm({ label, party, onChange, onTypeChange }: {
  label: string;
  party: ContractParty;
  onChange: (field: keyof ContractParty, value: string) => void;
  onTypeChange: (t: 'pf' | 'pj') => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{label}</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTypeChange('pf')}
          className={`flex-1 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
            party.type === 'pf' ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
          }`}
        >
          Pessoa fisica (CPF)
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('pj')}
          className={`flex-1 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
            party.type === 'pj' ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
          }`}
        >
          Pessoa juridica (CNPJ)
        </button>
      </div>
      <Field label={party.type === 'pj' ? 'Razao social' : 'Nome completo'} required>
        <TextInput value={party.name} onChange={(v) => onChange('name', v)} placeholder={party.type === 'pj' ? 'Empresa LTDA' : 'Nome completo'} />
      </Field>
      <Field label={party.type === 'pj' ? 'CNPJ' : 'CPF'} required>
        <TextInput value={party.document} onChange={(v) => onChange('document', v)} placeholder={party.type === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'} />
      </Field>
      <Field label="Endereco (rua, numero, complemento)" required>
        <TextInput value={party.address_street} onChange={(v) => onChange('address_street', v)} placeholder="Rua X, 123, apto 4" />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Cidade" required>
          <TextInput value={party.address_city} onChange={(v) => onChange('address_city', v)} placeholder="Sao Paulo" />
        </Field>
        <Field label="UF" required>
          <TextInput value={party.address_state} onChange={(v) => onChange('address_state', v.toUpperCase().slice(0, 2))} placeholder="SP" />
        </Field>
        <Field label="CEP" required>
          <TextInput value={party.address_zip} onChange={(v) => onChange('address_zip', v)} placeholder="00000-000" />
        </Field>
      </div>
      {party.type === 'pj' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome do representante legal">
            <TextInput value={party.representative ?? ''} onChange={(v) => onChange('representative', v)} placeholder="Quem assina pela empresa" />
          </Field>
          <Field label="CPF do representante">
            <TextInput value={party.representative_document ?? ''} onChange={(v) => onChange('representative_document', v)} placeholder="000.000.000-00" />
          </Field>
        </div>
      )}
    </div>
  );
}

function StepShow({ input, update }: { input: ContractInput; update: <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detalhes do show</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Data do show" required>
          <input
            type="date"
            value={input.show_date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => update('show_date', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
          />
        </Field>
        <Field label="Horario (HH:MM)" required>
          <input
            type="time"
            value={input.show_time}
            onChange={(e) => update('show_time', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
          />
        </Field>
      </div>
      <Field label="Duracao (minutos)">
        <div className="grid grid-cols-5 gap-2">
          {[30, 45, 60, 90, 120].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update('show_duration_min', m)}
              className={`px-2 py-2 rounded-xl border text-sm font-semibold transition ${
                input.show_duration_min === m ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
              }`}
            >
              {m}min
            </button>
          ))}
        </div>
      </Field>
      <Field label="Nome do local (casa de show, evento, festival)" required>
        <TextInput value={input.venue_name} onChange={(v) => update('venue_name', v)} placeholder="Ex: Sesc Pompeia / Clube B / Festival X" />
      </Field>
      <Field label="Endereco do local" required>
        <TextInput value={input.venue_address} onChange={(v) => update('venue_address', v)} placeholder="Rua, numero, cidade, UF" />
      </Field>
      <Field label="Tipo do evento" required>
        <TextInput value={input.event_type} onChange={(v) => update('event_type', v)} placeholder="Ex: Show musical em casa de shows" />
      </Field>
      <Checkbox label="Tem atracao de abertura?" checked={input.has_opening_act} onChange={(v) => update('has_opening_act', v)} />
      {input.has_opening_act && (
        <Field label="Nome da atracao de abertura">
          <TextInput value={input.opening_act_name ?? ''} onChange={(v) => update('opening_act_name', v)} placeholder="Nome do artista abertura" />
        </Field>
      )}
    </div>
  );
}

function StepPayment({ input, update }: { input: ContractInput; update: <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => void }) {
  const reais = (input.cache_total / 100).toFixed(2).replace('.', ',');
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cache e pagamento</h2>
      <Field label="Cache total (R$)" hint="Valor total bruto do show" required>
        <div className="relative">
          <span className="absolute left-4 top-3 text-brand-muted">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={reais}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
              const n = Number(cleaned) || 0;
              update('cache_total', Math.round(n * 100));
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-brand-green/50"
          />
        </div>
      </Field>
      <Field label="Forma de pagamento">
        <div className="grid grid-cols-4 gap-2">
          {(['pix', 'transfer', 'cash', 'boleto'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update('payment_method', m)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition capitalize ${
                input.payment_method === m ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
              }`}
            >
              {m === 'transfer' ? 'TED/DOC' : m === 'cash' ? 'Dinheiro' : m === 'pix' ? 'PIX' : 'Boleto'}
            </button>
          ))}
        </div>
      </Field>
      <Field label={`Sinal antecipado: ${input.deposit_percent}%`} hint="0% = pagamento so no show. 100% = tudo antecipado.">
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={input.deposit_percent}
          onChange={(e) => update('deposit_percent', Number(e.target.value))}
          className="w-full accent-brand-green"
        />
      </Field>
      {input.deposit_percent > 0 && input.deposit_percent < 100 && (
        <Field label="Data limite pro sinal (opcional)">
          <input
            type="date"
            value={input.deposit_due_date ?? ''}
            onChange={(e) => update('deposit_due_date', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
          />
        </Field>
      )}
      <Field label="Quando pagar o saldo?">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            { v: 'before_show', l: 'Ate 3 dias antes' },
            { v: 'on_show_day', l: 'No dia do show' },
            { v: 'after_show', l: 'Ate 5 dias uteis depois' },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => update('balance_due_timing', opt.v)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                input.balance_due_timing === opt.v ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepResponsibilities({ input, update }: { input: ContractInput; update: <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Responsabilidades do CONTRATANTE</h2>
      <p className="text-xs text-brand-muted">Marque tudo que o CONTRATANTE (casa de show/produtor) deve fornecer ou arcar.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Checkbox label="Equipamento tecnico (conforme rider)" checked={input.provides_equipment} onChange={(v) => update('provides_equipment', v)} />
        <Checkbox label="Transporte" checked={input.provides_transport} onChange={(v) => update('provides_transport', v)} />
        <Checkbox label="Hospedagem" checked={input.provides_accommodation} onChange={(v) => update('provides_accommodation', v)} />
        <Checkbox label="Alimentacao" checked={input.provides_meals} onChange={(v) => update('provides_meals', v)} />
        <Checkbox label="Seguranca" checked={input.provides_security} onChange={(v) => update('provides_security', v)} />
        <Checkbox label="Divulgacao do evento" checked={input.provides_promotion} onChange={(v) => update('provides_promotion', v)} />
      </div>
    </div>
  );
}

function StepClauses({ input, update }: { input: ContractInput; update: <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cancelamento</h2>
          <HelpTooltip content={
            <>
              <strong>{CLAUSE_HELP.cancellation.what}</strong>
              <br />
              <span className="text-brand-muted block mt-1">Quando usar: {CLAUSE_HELP.cancellation.when}</span>
              {CLAUSE_HELP.cancellation.example && (
                <em className="text-brand-muted block mt-1">Ex: {CLAUSE_HELP.cancellation.example}</em>
              )}
            </>
          } />
        </div>
        <p className="text-xs text-brand-muted">% de multa sobre o cache se houver cancelamento.</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Menos de 7 dias">
            <PercentInput value={input.cancel_fee_less_7_days} onChange={(v) => update('cancel_fee_less_7_days', v)} />
          </Field>
          <Field label="7 a 30 dias">
            <PercentInput value={input.cancel_fee_7_to_30_days} onChange={(v) => update('cancel_fee_7_to_30_days', v)} />
          </Field>
          <Field label="Mais de 30 dias">
            <PercentInput value={input.cancel_fee_more_30_days} onChange={(v) => update('cancel_fee_more_30_days', v)} />
          </Field>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Direitos de imagem e gravacao</h2>
          <HelpTooltip content={
            <>
              <strong>{CLAUSE_HELP.recording.what}</strong>
              <br />
              <span className="text-brand-muted block mt-1">Quando usar: {CLAUSE_HELP.recording.when}</span>
              {CLAUSE_HELP.recording.example && (
                <em className="text-brand-muted block mt-1">Ex: {CLAUSE_HELP.recording.example}</em>
              )}
            </>
          } />
        </div>
        <Field label="Gravacao do show">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { v: 'prohibited', l: 'Proibida' },
              { v: 'personal_only', l: 'Apenas uso pessoal do publico' },
              { v: 'promo_with_credit', l: 'Permitida com credito' },
              { v: 'full_rights', l: 'Totalmente liberada' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => update('recording_allowed', opt.v)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                  input.recording_allowed === opt.v ? 'border-brand-green bg-brand-green/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </Field>
        <Checkbox label="Transmissao ao vivo (streaming) permitida" checked={input.streaming_allowed} onChange={(v) => update('streaming_allowed', v)} />
        <Checkbox label="Contratante pode usar imagem pra divulgacao deste evento" checked={input.image_rights_for_promo} onChange={(v) => update('image_rights_for_promo', v)} />
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Exclusividade geografica (opcional)</h2>
          <HelpTooltip content={
            <>
              <strong>{CLAUSE_HELP.exclusivity.what}</strong>
              <br />
              <span className="text-brand-muted block mt-1">Quando usar: {CLAUSE_HELP.exclusivity.when}</span>
              {CLAUSE_HELP.exclusivity.example && (
                <em className="text-brand-muted block mt-1">Ex: {CLAUSE_HELP.exclusivity.example}</em>
              )}
            </>
          } />
        </div>
        <Checkbox label="Incluir clausula de exclusividade" checked={input.has_exclusivity} onChange={(v) => update('has_exclusivity', v)} />
        {input.has_exclusivity && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Raio (km)">
              <input
                type="number"
                min={1}
                value={input.exclusivity_radius_km ?? 50}
                onChange={(e) => update('exclusivity_radius_km', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </Field>
            <Field label="Dias antes do show">
              <input
                type="number"
                min={1}
                value={input.exclusivity_days_before ?? 30}
                onChange={(e) => update('exclusivity_days_before', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </Field>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Clausulas extras (opcional)</h2>
        <Field label="Qualquer disposicao especifica que queira adicionar" hint="Ex: forma de pagamento com retencao de impostos, clausula de backstage restrito, bilheteria partilhada, etc.">
          <textarea
            value={input.extra_clauses ?? ''}
            onChange={(e) => update('extra_clauses', e.target.value)}
            rows={4}
            placeholder="Deixe em branco se nao tiver clausulas extras"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 resize-none"
          />
        </Field>
      </div>
    </div>
  );
}

function StepReview({ input, update }: { input: ContractInput; update: <K extends keyof ContractInput>(k: K, v: ContractInput[K]) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Revisao final e foro</h2>

      {/* Resumo */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 space-y-2 text-sm">
        <Row label="Contratante" value={input.contractor.name || '—'} />
        <Row label="Contratado" value={input.artist.name || '—'} />
        <Row label="Data" value={input.show_date || '—'} />
        <Row label="Local" value={input.venue_name || '—'} />
        <Row label="Cache" value={`R$ ${(input.cache_total / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <Row label="Sinal" value={`${input.deposit_percent}%`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cidade do foro" required hint="Cidade que julgaria disputas do contrato">
          <TextInput value={input.forum_city} onChange={(v) => update('forum_city', v)} placeholder="Ex: Sao Paulo" />
        </Field>
        <Field label="UF do foro" required>
          <TextInput value={input.forum_state} onChange={(v) => update('forum_state', v.toUpperCase().slice(0, 2))} placeholder="SP" />
        </Field>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-100">
        <p className="font-bold mb-1">Lembre-se</p>
        <p className="text-yellow-100/80 leading-relaxed">
          Este contrato e um modelo profissional que cobre 90% dos shows. Para shows de alto valor ou situacoes peculiares (ex: festivais grandes, shows internacionais), leia com calma e, se tiver duvida, consulte um advogado.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-brand-muted text-xs uppercase tracking-wider">{label}</span>
      <span className="text-white text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

// ==================== HELPERS UI ====================

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

function PercentInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))))}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-brand-green/50"
      />
      <span className="absolute right-4 top-3 text-brand-muted">%</span>
    </div>
  );
}
