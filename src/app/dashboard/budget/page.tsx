'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useArtistProfile } from '@/lib/use-artist-profile';
import { useAiLimit } from '@/lib/use-ai-limit';
import { UpgradeModal } from '@/lib/upgrade-modal';

const MONEY_ICON = String.fromCodePoint(0x1F4B0);

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}

const CATEGORIES_INCOME = ['Shows', 'Streaming', 'Merch', 'Sync/Licensing', 'Patrocinío', 'Outro'];
const CATEGORIES_EXPENSE = ['Produção', 'Marketing', 'Equipamento', 'Transporte', 'Alimentação', 'Estúdio', 'Outro'];

export default function BudgetPage() {
  const { profile: artistProfile } = useArtistProfile();
  const { tryGenerate, showUpgrade, closeUpgrade, remaining } = useAiLimit();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Produção',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
      setLoading(false);
  }, []);

  async function loadTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('budget_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    if (data) setTransactions(data);
  }

  async function addTransaction() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !formData.description || !formData.amount) return;
    await supabase.from('budget_transactions').insert({
      user_id: user.id,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    });
    setFormData({ description: '', amount: '', type: 'expense', category: 'Produção', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
    loadTransactions();
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'budget_report',
          context: { transactions: transactions.slice(0, 50), artistProfile }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar relatório.');
    } catch {
      setGeneratedContent('Erro ao gerar relatório. Tente novamente.');
    }
    setGenerating(false);
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;


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
          <span className="text-3xl">{MONEY_ICON}</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Budget & Finanças</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-xs text-green-400">Receitas</div>
            <div className="text-lg font-bold text-green-400">R$ {totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-xs text-red-400">Despesas</div>
            <div className="text-lg font-bold text-red-400">R$ {totalExpense.toFixed(2)}</div>
          </div>
          <div className={`${balance >= 0 ? 'bg-brand-green/10 border-brand-green/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg p-4`}>
            <div className="text-xs text-white/60">Saldo</div>
            <div className={`text-lg font-bold ${balance >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              R$ {balance.toFixed(2)}
            </div>
          </div>
        </div>

        {/* New Transaction Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg text-sm hover:bg-brand-green/80 transition"
          >
            + Nova Transação
          </button>
        </div>

        {/* Add Transaction Form */}
        {showForm && (
          <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
            <h3 className="text-lg font-semibold mb-4">Nova Transação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Shows' : 'Produção' })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
                >
                  <option value="income" className="bg-brand-surface">Receita</option>
                  <option value="expense" className="bg-brand-surface">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
                >
                  {(formData.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => (
                    <option key={c} value={c} className="bg-brand-surface">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Show no Bar do Rock"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Valor (R$)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addTransaction}
                className="px-6 py-3 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/80 transition"
              >
                Adicionar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* AI Report */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-6 border border-white/10 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Relatório Financeiro IA</h3>
            <button
              onClick={() => tryGenerate(generateReport)}
              disabled={generating || transactions.length === 0}
              className="px-4 py-2 bg-brand-orange/20 text-brand-orange rounded-lg text-sm hover:bg-brand-orange/30 transition disabled:opacity-50"
            >
              {generating ? 'Analisando...' : 'Gerar Análise'}
            </button>
            {remaining !== null && <span className="text-xs text-white/30 ml-3">{remaining} gerações restantes</span>}
          </div>
          {generatedContent && (
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {generatedContent}
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="bg-brand-surface rounded-xl border border-white/10">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold">Transações</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              Nenhuma transação registrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {t.category} · {new Date(t.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <UpgradeModal open={showUpgrade} onClose={closeUpgrade} feature="Geração com IA" />
    </div>
  );
}
