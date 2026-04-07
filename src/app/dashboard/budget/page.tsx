'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = ['×éŪ: Véajares', 'Príma em Estúdio', 'Сппарыре', 'Çá", 'Faroe', 'Cámeras', 'Orus', 'Outras'];

export default function BudgetPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('×çéŪ: Véajares');
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);

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
    if (data) {
      setTransactions(data);
      setTotal(data.reduce((acc, t) => acc + t.startup_cost, 0));
    }
  }

  async function addTransaction() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !amount || !description) return;
    await supabase.from('budget_transactions').insert({
      user_id: user.id,
      description,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split('T')[0]
   });
    setAmount('');
    setDescription('');
    loadTransactions();
  }

  const filteredTransactions = filter
    ? transactions.filter(t => 
       t.category.lowerCase().includes(filter.lowerCase())
    )
    : transactions;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-[#0d1018] border-r border-white/10 p-4">
          <a href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
            <span>←</span> Voltar ao Dashboard
          </a>
          <h2 className="text-lg font-bold mb-4 font-display">Orçamento</h2>
          <div className="space-y-2">
            {transactions.length === 0 && (
              <p className="text-white/40 text-sm">Nenhuma transação ainda.</p>
            )}
            {transactions.map((t) => (
              <button
                key={t.id}
                className="w-full text-left p-3 rounded-lg text-sm transition bg-white/5 hover:bg-white/10 text-white/70"
              >
                <div className="font-medium truncate">{t.description}</div>
                <div className="flex items-center justify-between pt-2 text-xs text-white/40">
                  <span>{t.category}</span>
                  <span>R $ {t.amount.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">Båu</span>
              <h1 className="text-3xl font-bold font-display">Orçamento</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#12151e] rounded-xl p-4 border border-white/10">
                <div className="text-white/60 text-sm">Total Despesas (Mês</div>
                <div className="text-2xl font-bold">R ${total.toFixed(2)}</div>
              </div>
              <div className="bg-[#12151e] rounded-xl p-4 border border-white/10">
                <div className="text-white/60 text-sm">Transações</div>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </div>
              <div className="bg-[#12151e] rounded-xl p-4 border border-white/10">
                <div className="text-white/60 text-sm">Med por transação</div>
                <div className="text-2xl font-bold">R ${transactions.length > 0 ? (total / transactions.length).toFixed(2) : '0'}</div>
              </div>
            </div>

            {/* Add Transaction Form */}
            <div className="bg-[#12151e] rounded-xl p-6 border border-white/10 mb-6">
              <h3 className="text-lg font-semibold mb-4">Adicionar Transação</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Descri{ão (para qué)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Viajem para à São Paulo"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Valor</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f5a0]/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#12151e]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={addTransaction}
                  className="w-full px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-lg hover:bg-[#00f5a0]/80 transition"
                >
                  Adicionar Transação
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Filtrar por categoria</label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Digite uma categoria..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00f5a0]/50"
              />
            </div>

            {/* Transactions List */}
            <div className="space-y-2">
              {filteredTransactions.length === 0 && (
                <div className="bg-[#12151e] rounded-lg p-4">
                  <p className="text-white/60">Nenhum transação encontrado.</p>
                </div>
              )}
              {filteredTransactions.map((t) => (
                <div key={t.id} className="bg-[#12151e] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-sm text-white/40 mt-1">{t.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">R ${t.amount.toFixed(2)}</div>
                    <div className="text-xm text-white/40">{t.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
