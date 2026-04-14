'use client';

import { useState } from 'react';
import type { ActionPlanItem } from '@/lib/types/career';

interface Props {
  diagnosticId: string;
  actions: ActionPlanItem[];
  initialProgress: Record<number, boolean>;
}

export function ActionPlan({ diagnosticId, actions, initialProgress }: Props) {
  const [progress, setProgress] = useState(initialProgress);

  const toggle = async (index: number) => {
    const completed = !progress[index];
    setProgress({ ...progress, [index]: completed });
    await fetch('/api/action-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnostic_id: diagnosticId, action_index: index, completed }),
    });
  };

  return (
    <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
      <h2 className="text-xl font-bold text-white mb-6">Seu plano para os proximos 90 dias</h2>
      <div className="space-y-3">
        {actions.map((action, i) => {
          const done = !!progress[i];
          return (
            <div key={i} className={`flex gap-4 p-4 rounded-xl border ${done ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/10 bg-white/[0.02]'}`}>
              <button
                onClick={() => toggle(i)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-0.5 flex items-center justify-center ${done ? 'bg-brand-green border-brand-green' : 'border-white/30'}`}
              >
                {done && <span className="text-black text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-semibold ${done ? 'text-white/50 line-through' : 'text-white'}`}>{action.title}</h3>
                  <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{action.deadline_days} dias</span>
                  {action.priority === 1 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Prioridade alta</span>}
                </div>
                <p className={`text-sm leading-relaxed ${done ? 'text-white/40' : 'text-white/70'}`}>{action.description}</p>
                <p className={`text-xs mt-2 ${done ? 'text-white/30' : 'text-brand-green/80'}`}>{action.impact_expected}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
