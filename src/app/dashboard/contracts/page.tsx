'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface Contract {
  id: string;
  title: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
}

const CONTRACT_TYPES = ['Rider Técnico', 'Rider Hospitality', 'Contrato de Show', 'Contrato de Distribuição', 'Contrato de Licenciamento', 'Acordo de Parceria', 'NDA'];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [generating, setGenerating] = useState(false);
  const [contractType, setContractType] = useState('Rider Técnico');
  const [details, setDetails] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadContracts();
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
          context: { contractType, details }
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

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>←</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Contratos & Riders</h2>
          <div className="space-y-2">
            {contracts.length === 0 && (
              <p className="text-white/40 text-sm">Nenhum contrato ainda.</p>
            )}
            {contracts.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedContract(c); setGeneratedContent(''); }}
                className={`w-full text-left p-3 rounded-lg text-sm transition ${
                  selectedContract?.id === c.id
                    ? 'bg-[#00f5a0]/20 text-[#00f5a0]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="font-medium truncate">{c.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">{c.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[c.status] || 'bg-white/10 text-white/40'}`}>
                    {c.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">📄</span>
              <h1 className="text-3xl font-bold font-display">Contratos & Riders</h1>
            </div>

            {/* Generator */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Gerar Documento com IA</h3>
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">Tipo de Documento</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#12151e]">{t}</option>
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
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50 resize-none"
                />
              </div>
              <button
                onClick={generateContract}
                disabled={generating}
                className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Gerando...' : 'Gerar Documento'}
              </button>
            </div>

            {/* Content Display */}
            {(generatedContent || selectedContract) && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {generatedContent ? contractType : selectedContract?.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    {generatedContent && (
                      <button
                        onClick={saveContract}
                        className="px-4 py-2 bg-[#00f5a0]/20 text-[#00f5a0] rounded-lg text-sm hover:bg-[#00f5a0]/30 transition"
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
        </div>
      </div>
    </div>
  );
}
