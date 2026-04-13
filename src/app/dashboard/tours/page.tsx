'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { UpgradeGate } from '@/lib/upgrade-gate';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { exportAsText, exportAsPDF } from '@/lib/export-content';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const MAP_ICON = String.fromCodePoint(0x1F5FA);

interface TourDate {
  id: string;
  venue: string;
  city: string;
  date: string;
  status: string;
  notes: string;
  fee: number;
  created_at: string;
}

interface Tour {
  id: string;
  name: string;
  dates: TourDate[];
  created_at: string;
}

function ToursContent() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [generating, setGenerating] = useState(false);
  const [region, setRegion] = useState('');
  const [numDates, setNumDates] = useState('5');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({
    venue: '', city: '', date: '', fee: '', notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
      setLoading(false);
  }, []);

  async function loadTours() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tours')
      .select('*, tour_dates(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTours(data.map(t => ({ ...t, dates: t.tour_dates || [] })));
  }

  async function generateTourPlan() {
    if (!region.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tour_plan',
          context: { region, numDates: parseInt(numDates), artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar plano de turnê.');
    } catch {
      setGeneratedContent('Erro ao gerar plano de turnê. Tente novamente.');
    }
    setGenerating(false);
  }

  async function saveTour() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !generatedContent) return;
    await supabase.from('tours').insert({
      user_id: user.id,
      name: `Turnê ${region}`,
      notes: generatedContent
    });
    setGeneratedContent('');
    setRegion('');
    loadTours();
  }

  async function addTourDate() {
    if (!selectedTour || !newDate.venue || !newDate.city || !newDate.date) return;
    await supabase.from('tour_dates').insert({
      tour_id: selectedTour.id,
      venue: newDate.venue,
      city: newDate.city,
      date: newDate.date,
      fee: parseFloat(newDate.fee) || 0,
      notes: newDate.notes,
      status: 'confirmed'
    });
    setNewDate({ venue: '', city: '', date: '', fee: '', notes: '' });
    setShowAddDate(false);
    loadTours();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusColors: Record<string, string> = {
    'confirmed': 'bg-green-500/20 text-green-400',
    'pending': 'bg-yellow-500/20 text-yellow-400',
    'cancelled': 'bg-red-500/20 text-red-400',
    'completed': 'bg-blue-500/20 text-blue-400'
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
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{MAP_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Planejamento de Turnê</h1>
        </div>
        <p className="text-brand-purple text-sm mb-6 ml-12">Módulo Business</p>

        {/* AI Tour Planner */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-brand-purple/20 mb-6">
          <h3 className="text-lg font-semibold mb-4">Planejar Turnê com IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Região / Rota</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ex: Sul do Brasil, São Paulo e interior..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-purple/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Número de datas</label>
              <input
                type="number"
                value={numDates}
                onChange={(e) => setNumDates(e.target.value)}
                min="1"
                max="30"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-purple/50"
              />
            </div>
          </div>
          <button
            onClick={() => tryGenerate(generateTourPlan)}
            disabled={generating || !region.trim()}
            className="px-6 py-3 bg-brand-purple text-white font-bold rounded-lg hover:bg-brand-purple/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Planejando...' : 'Gerar Plano de Turnê'}
          </button>
          {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
        </div>

        {/* Saved tours list */}
        {tours.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-white/40 uppercase tracking-wider mb-3">Salvos</h3>
            <div className="flex flex-wrap gap-2">
              {tours.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTour(t); setGeneratedContent(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedTour?.id === t.id
                      ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {t.name}
                  <span className="ml-2 text-xs text-white/40">
                    {t.dates.length} data{t.dates.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generated Plan */}
        {generatedContent && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold">Plano: Turnê {region}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => exportAsText(generatedContent, `turne-${region}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportAsPDF(generatedContent, `Turne ${region}`)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                >
                  PDF
                </button>
                <button
                  onClick={saveTour}
                  className="px-4 py-2 bg-brand-purple/20 text-brand-purple rounded-lg text-sm hover:bg-brand-purple/30 transition"
                >
                  Salvar Turnê
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {generatedContent}
            </div>
          </div>
        )}

        {/* Selected Tour Details */}
        {selectedTour && !generatedContent && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h3 className="text-xl font-semibold">{selectedTour.name}</h3>
              <button
                onClick={() => setShowAddDate(!showAddDate)}
                className="px-4 py-2 bg-brand-purple/20 text-brand-purple rounded-lg text-sm hover:bg-brand-purple/30 transition"
              >
                + Adicionar Data
              </button>
            </div>

            {showAddDate && (
              <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newDate.venue}
                    onChange={(e) => setNewDate({ ...newDate, venue: e.target.value })}
                    placeholder="Venue"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newDate.city}
                    onChange={(e) => setNewDate({ ...newDate, city: e.target.value })}
                    placeholder="Cidade"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newDate.date}
                    onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newDate.fee}
                    onChange={(e) => setNewDate({ ...newDate, fee: e.target.value })}
                    placeholder="Cachê (R$)"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addTourDate} className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm">
                    Adicionar
                  </button>
                  <button onClick={() => setShowAddDate(false)} className="px-4 py-2 bg-white/10 rounded-lg text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {selectedTour.dates.length === 0 ? (
              <div className="text-center text-white/40 py-8">
                Nenhuma data adicionada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTour.dates.map((d, i) => (
                  <div key={d.id || i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-brand-purple">
                        {new Date(d.date).getDate()}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(d.date).toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{d.venue}</div>
                      <div className="text-sm text-white/60">{d.city}</div>
                    </div>
                    {d.fee > 0 && (
                      <div className="text-brand-green font-medium">
                        R$ {d.fee.toFixed(2)}
                      </div>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[d.status] || 'bg-white/10 text-white/40'}`}>
                      {d.status}
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
                  <span className="text-white/60">{selectedTour.dates.length} data(s)</span>
                  <span className="text-brand-green font-medium">
                    Total: R$ {selectedTour.dates.reduce((a, b) => a + (b.fee || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}

export default function ToursPage() {
  return (
    <UpgradeGate module="tours">
      <ToursContent />
    </UpgradeGate>
  );
}
