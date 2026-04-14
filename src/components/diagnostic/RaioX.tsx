import type { DimensionScores, DiagnosticText, SpotifyArtistData, SurveyResponse } from '@/lib/types/career';

interface Props {
  dimensions: DimensionScores;
  readings: DiagnosticText['metric_readings'];
  spotify: SpotifyArtistData;
  survey: SurveyResponse;
}

const FREQUENCY_LABELS: Record<SurveyResponse['release_frequency'], string> = {
  sporadic: 'Esporadico',
  quarterly: 'Trimestral',
  monthly: 'Mensal',
  weekly: 'Semanal',
};

export function RaioX({ dimensions, readings, spotify, survey }: Props) {
  const listenersDisplay = spotify.monthly_listeners
    ? spotify.monthly_listeners.toLocaleString('pt-BR')
    : 'Nao disponivel';

  const engagementPct = spotify.monthly_listeners && spotify.followers
    ? `${Math.round((spotify.followers / spotify.monthly_listeners) * 100)}%`
    : '—';

  const cards = [
    {
      label: 'Ouvintes Mensais (Spotify)',
      value: listenersDisplay,
      reading: readings.monthly_listeners,
    },
    {
      label: 'Crescimento',
      value: `${dimensions.growth_trajectory}/100`,
      reading: readings.growth_rate,
    },
    {
      label: 'Consistencia de Lancamento',
      value: FREQUENCY_LABELS[survey.release_frequency],
      reading: readings.release_consistency,
    },
    {
      label: 'Engajamento (followers/listeners)',
      value: engagementPct,
      reading: readings.engagement,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-brand-surface rounded-xl p-6 border border-white/10">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2">{c.label}</p>
          <p className="text-3xl font-bold text-white mb-3">{c.value}</p>
          <p className="text-sm text-white/70 leading-relaxed">{c.reading}</p>
        </div>
      ))}
    </div>
  );
}
