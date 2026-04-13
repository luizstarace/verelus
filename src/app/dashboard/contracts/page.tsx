'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const DOCUMENT_ICON = String.fromCodePoint(0x1F4C4);

interface Contract {
  id: string;
  title: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
}

const CONTRACT_TYPES = ['Rider Técnico', 'Rider Hospitality', 'Contrato de Show', 'Contrato de Distribuição', 'Contrato de Licenciamento', 'Acordo de Parceria', 'NDA'];

function ContractsContent() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [generating, setGenerating] = useState(false);
  const [contractType, setContractType] = useState('Rider Técnico');
  const [details, setDetails] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
      setLoading(false);
  }, []);

  async function loadContracts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setContracts(data);
  }

  async function generateContract() {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contract',
          context: { contractType, details, artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar contrato.');
    } catch {
      setGeneratedContent('Erro ao gerar contrato. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveContract() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('contracts').insert({
      user_id: user.id,
      title: `${contractType}${details ? ' - ' + details.substring(0, 30) : ''}`,
      type: contractType,
      content: generatedContent,
      status: 'draft'
    });
    setGeneratedContent('');
    setDetails('');
    loadContracts();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent || selectedContract?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusColors: Record<string, string> = {
    'draft': 'bg-white/10 text-white/40',
    'sent': 'bg-blue-500/20 text-blue-400',
    'signed': 'bg-green-500/20 text-green-400',
    'expired': 'bg-red-500/20 text-red-400'
  };


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{DOCUMENT_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Contratos & Riders</h1>
        </div>

        {/* Generator */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Documento com IA</h3>
          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2">Tipo de Documento</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
            >
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-brand-surface">{t}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2">Detalhes adicionais</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: show em São Paulo, 2h de duração, banda de 5 integrantes..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 resize-none"
            />
          </div>
          <button
            onClick={() => tryGenerate(generateContract)}
            disabled={generating}
            className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando...' : 'Gerar Documento'}
          </button>
          {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
        </div>

        {/* Saved items list */}
        {contracts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3">Salvos</h3>
            <div className="flex flex-wrap gap-2">
              {contracts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedContract(c); setGeneratedContent(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                    selectedContract?.id === c.id
                      ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {c.title}
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || 'bg-white/10 text-white/40'}`}>
                    {c.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Display */}
        {(generatedContent || selectedContract) && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">
                {generatedContent ? contractType : selectedContract?.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent || selectedContract?.content || '', selectedContract?.title || contractType)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent || selectedContract?.content || '', selectedContract?.title || contractType)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                {generatedContent && (
                  <button
                    onClick={saveContract}
                    className="px-4 py-2 bg-brand-green/20 text-brand-green rounded-lg text-sm hover:bg-brand-green/30 transition"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed font-mono text-sm">
              {generatedContent || selectedContract?.content}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function ContractsPage() {
  return (
    <UpgradeGate module="contracts">
      <ContractsContent />
    </UpgradeGate>
  );
}
