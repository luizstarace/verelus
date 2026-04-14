import type { Stage } from '@/lib/types/career';

interface Props {
  stage: Stage;
  score: number;
  artistName: string;
}

const STAGE_COLORS: Record<Stage, string> = {
  Inicial: 'from-gray-400 to-gray-600',
  Emergente: 'from-blue-400 to-blue-600',
  Consolidado: 'from-green-400 to-green-600',
  Estabelecido: 'from-purple-400 to-purple-600',
  Referencia: 'from-orange-400 to-red-600',
};

export function StageHeader({ stage, score, artistName }: Props) {
  const nextStageThresholds: Record<Stage, number> = {
    Inicial: 20, Emergente: 40, Consolidado: 60, Estabelecido: 80, Referencia: 100,
  };
  const upper = nextStageThresholds[stage];
  const lower = upper === 20 ? 0 : upper - 20;
  const pctInStage = ((score - lower) / (upper - lower)) * 100;

  return (
    <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
      <p className="text-brand-muted text-sm uppercase tracking-wider font-mono mb-2">Diagnostico de {artistName}</p>
      <h1 className="text-4xl font-bold text-white mb-2">
        Voce esta no estagio <span className={`bg-gradient-to-r ${STAGE_COLORS[stage]} bg-clip-text text-transparent`}>{stage}</span>
      </h1>
      <p className="text-brand-muted mb-6">Score geral: {score}/100</p>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${STAGE_COLORS[stage]}`} style={{ width: `${Math.max(5, pctInStage)}%` }} />
      </div>
      <p className="text-xs text-brand-muted mt-2">
        {stage !== 'Referencia' ? `${Math.round(100 - pctInStage)}% para chegar ao proximo estagio` : 'Voce esta no topo da framework'}
      </p>
    </div>
  );
}
