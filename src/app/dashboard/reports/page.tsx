'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

const CHART_ICON = String.fromCodePoint(0x1F4CA);

interface Report {
  id: string;
  title: string;
  period: string;
  content: string;
  created_at: string;
}

export default function ReportsPage() {
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
          context: { period }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar relat\u00f3rio.');
    } catch {
      setGeneratedContent('Erro ao gerar relat\u00f3rio. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveReport() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('monthly_reports').insert({
      user_id: user.id,
      title: `Relat\u00f3rio ${period}`,
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
        <div className="w-6 h-6 border-2 border-[#00f5a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>&lt;-</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Relat\u00f3rios</h2>
          <div className="space-y-2">
            {reports.length === 0 && (
              <p className="text-white/40 text-sm">Nenhum relat\u00f3rio ainda.</p>
            )}
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedReport(r); setGeneratedContent(''); }}
                className={`w-full text-left p-3 rounded-lg text-sm transition ${
                  selectedReport?.id === r.id
                    ? 'bg-[#00f5a0]/20 text-[#00f5a0]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-white/40 mt-1">{r.period}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">{CHART_ICON}</span>
              <h1 className="text-3xl font-bold font-display">Relat\u00f3rios Mensais</h1>
            </div>

            {/* Generator */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Gerar Relat\u00f3rio com IA</h3>
              <p className="text-white/60 text-sm mb-4">
                A IA vai analisar seus dados de streaming, pitches, finan\u00e7as e atividade para gerar um relat\u00f3rio completo do per\u00edodo.
              </p>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Per\u00edodo</label>
                  <input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                  />
                </div>
                <button
                  onClick={generateReport}
                  disabled={generating}
                  className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Gerando...' : 'Gerar Relat\u00f3rio'}
                </button>
              </div>
            </div>

            {/* Content Display */}
            {(generatedContent || selectedReport) && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {generatedContent ? `Relat\u00f3rio ${period}` : selectedReport?.title}
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
                        onClick={saveReport}
                        className="px-4 py-2 bg-[#00f5a0]/20 text-[#00f5a0] rounded-lg text-sm hover:bg-[#00f5a0]/30 transition"
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
        </div>
      </div>
    </div>
  );
}
