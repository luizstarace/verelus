'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

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

const CATEGORIES_INCOME = ['Shows', 'Streaming', 'Merch', 'Sync/Licensing', 'Patrocin\u00edo', 'Outro'];
const CATEGORIES_EXPENSE = ['Produ\u00e7\u00e3o', 'Marketing', 'Equipamento', 'Transporte', 'Alimenta\u00e7\u00e3o', 'Est\u00fadio', 'Outro'];

export default function BudgetPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Produ\u00e7\u00e3o',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTransactions();
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
    setFormData({ description: '', amount: '', type: 'expense', category: 'Produ\u00e7\u00e3o', date: new Date().toISOString().split('T')[0] });
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
          context: { transactions: transactions.slice(0, 50) }
        })
      });
      const data = await res.json();
      setGeneratedContent(data.content || 'Erro ao gerar relat\u00f3rio.');
    } catch {
      setGeneratedContent('Erro ao gerar relat\u00f3rio. Tente novamente.');
    }
    setGenerating(false);
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>&lt;-</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Financeiro</h2>

          {/* Summary Cards */}
          <div className="space-y-3 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="text-xs text-green-400">Receitas</div>
              <div className="text-lg font-bold text-green-400">R$ {totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-xs text-red-400">Despesas</div>
              <div className="text-lg font-bold text-red-400">R$ {totalExpense.toFixed(2)}</div>
            </div>
            <div className={`${balance >= 0 ? 'bg-[#00f5a0]/10 border-[#00f5a0]/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg p-3`}>
              <div className="text-xs text-white/60">Saldo</div>
              <div className={`text-lg font-bold ${balance >= 0 ? 'text-[#00f5a0]' : 'text-red-400'}`}>
                R$ {balance.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full py-2 bg-[#00f5a0] text-black font-bold rounded-lg text-sm hover:bg-[#00f5a0]/80 transition"
          >
            + Nova Transa\u00e7\u00e3o
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">{MONEY_ICON}</span>
              <h1 className="text-3xl font-bold font-display">Budget & Finan\u00e7as</h1>
            </div>

            {/* Add Transaction Form */}
            {showForm && (
              <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
                <h3 className="text-lg font-semibold mb-4">Nova Transa\u00e7\u00e3o</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: e.target.value === 'income' ? 'Shows' : 'Produ\u00e7\u00e3o' })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                    >
                      <option value="income" className="bg-[#12151e]">Receita</option>
                      <option value="expense" className="bg-[#12151e]">Despesa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                    >
                      {(formData.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => (
                        <option key={c} value={c} className="bg-[#12151e]">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Descri\u00e7\u00e3o</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Show no Bar do Rock"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Valor (R$)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={addTransaction}
                    className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition"
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
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Relat\u00f3rio Financeiro IA</h3>
                <button
                  onClick={generateReport}
                  disabled={generating || transactions.length === 0}
                  className="px-4 py-2 bg-[#f5a623]/20 text-[#f5a623] rounded-lg text-sm hover:bg-[#f5a623]/30 transition disabled:opacity-50"
                >
                  {generating ? 'Analisando...' : 'Gerar An\u00e1lise'}
                </button>
              </div>
              {generatedContent && (
                <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
                  {generatedContent}
                </div>
              )}
            </div>

            {/* Transaction List */}
            <div className="bg-[#12151e] rounded-xl border border-white/10">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">Transa\u00e7\u00f5es</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  Nenhuma transa\u00e7\u00e3o registrada ainda.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {transactions.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.description}</div>
                        <div className="text-xs text-white/40 mt-1">
                          {t.category} \u00b7 {new Date(t.date).toLocaleDateString('pt-BR')}
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
        </div>
      </div>
    </div>
  );
}
