'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StageHeader } from '@/components/diagnostic/StageHeader';
import { RaioX } from '@/components/diagnostic/RaioX';
import { DiagnosticText } from '@/components/diagnostic/DiagnosticText';
import { ActionPlan } from '@/components/diagnostic/ActionPlan';
import type { DiagnosticResult } from '@/lib/types/career';

interface ApiResponse {
  diagnostic: DiagnosticResult;
  progress: Record<number, boolean>;
}

export default function DiagnosticPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/diagnostic/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = (await r.json()) as { error: string };
          throw new Error(err.error);
        }
        return r.json() as Promise<ApiResponse>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        Carregando diagnostico...
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const { diagnostic, progress } = data;

  return (
    <div className="min-h-screen bg-brand-dark text-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <StageHeader
          stage={diagnostic.stage}
          score={diagnostic.stage_score}
          artistName={diagnostic.artist_data_snapshot.name}
        />
        <RaioX
          dimensions={diagnostic.dimension_scores}
          readings={diagnostic.diagnostic_text.metric_readings}
          spotify={diagnostic.artist_data_snapshot}
          survey={diagnostic.survey_snapshot}
        />
        <DiagnosticText text={diagnostic.diagnostic_text} />
        <ActionPlan
          diagnosticId={diagnostic.id}
          actions={diagnostic.action_plan}
          initialProgress={progress}
        />
      </div>
    </div>
  );
}
