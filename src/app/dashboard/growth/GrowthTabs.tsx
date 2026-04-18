'use client';

import { useState } from 'react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { GrowthClient } from './GrowthClient';
import { GoalsClient } from '../goals/GoalsClient';
import { CompetitorsClient } from '../competitors/CompetitorsClient';

type Tab = 'growth' | 'goals' | 'competitors';

const TABS: Array<{ key: Tab; label: string; description: string }> = [
  { key: 'growth', label: 'Crescimento', description: 'Números reais da semana nas plataformas' },
  { key: 'goals', label: 'Metas', description: 'Defina metas e acompanhe o ritmo' },
  { key: 'competitors', label: 'Concorrentes', description: 'Compare seu crescimento com outros artistas' },
];

export function GrowthTabs({ initialTab }: { initialTab?: Tab }) {
  const [active, setActive] = useState<Tab>(initialTab ?? 'growth');

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <ToolPageHeader
          title="Painel de Crescimento"
          description={TABS.find((t) => t.key === active)?.description ?? ''}
          icon={<ToolIcon tool="growth" size={22} />}
          accent="orange"
        />

        <div className="flex gap-1 mb-8 bg-brand-surface rounded-xl p-1 border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === tab.key
                  ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {active === 'growth' && <GrowthPanel />}
        {active === 'goals' && <GoalsPanel />}
        {active === 'competitors' && <CompetitorsPanel />}
      </div>
    </div>
  );
}

function GrowthPanel() {
  return (
    <div className="growth-panel-embed">
      <GrowthClient embedded />
    </div>
  );
}

function GoalsPanel() {
  return (
    <div className="goals-panel-embed">
      <GoalsClient embedded />
    </div>
  );
}

function CompetitorsPanel() {
  return (
    <div className="competitors-panel-embed">
      <CompetitorsClient embedded />
    </div>
  );
}
