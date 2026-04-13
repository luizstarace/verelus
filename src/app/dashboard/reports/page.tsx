'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const CHART_ICON = String.fromCodePoint(0x1F4CA);

interface Report {
  id: string;
  title: string;
  period: string;
  content: string;
  created_at: string;
}

function ReportsContent() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
    // Set default period to current month
    const now = new Date();
    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setLoading(false);
  }, []);

  async function loadReports() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setReports(data);
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monthly_report',
          context: { period, artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar relatório.');
    } catch {
      setGeneratedContent('Erro ao gerar relatório. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveReport() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('monthly_reports').insert({
      user_id: user.id,
      title: `Relatório ${period}`,
      period,
      content: generatedContent
    });
    setGeneratedContent('');
    loadReports();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent || selectedReport?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }


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
          <span className="text-3xl">{CHART_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Relatórios Mensais</h1>
        </div>

        {/* Generator */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Relatório com IA</h3>
          <p className="text-white/60 text-sm mb-4">
            A IA vai analisar seus dados de streaming, pitches, finanças e atividade para gerar um relatório completo do período.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="block text-sm text-white/60 mb-2">Período</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </div>
            <button
              onClick={() => tryGenerate(generateReport)}
              disabled={generating}
              className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Gerando...' : 'Gerar Relatório'}
            </button>
            {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
          </div>
        </div>

        {/* Saved items list */}
        {reports.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3">Salvos</h3>
            <div className="flex flex-wrap gap-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedReport(r); setGeneratedContent(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedReport?.id === r.id
                      ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Display */}
        {(generatedContent || selectedReport) && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">
                {generatedContent ? `Relatório ${period}` : selectedReport?.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent || selectedReport?.content || '', selectedReport?.title || `relatorio-${period}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent || selectedReport?.content || '', selectedReport?.title || `Relatorio ${period}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                {generatedContent && (
                  <button
                    onClick={saveReport}
                    className="px-4 py-2 bg-brand-green/20 text-brand-green rounded-lg text-sm hover:bg-brand-green/30 transition"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {generatedContent || selectedReport?.content}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <UpgradeGate module="reports">
      <ReportsContent />
    </UpgradeGate>
  );
}
