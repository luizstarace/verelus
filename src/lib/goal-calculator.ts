import type { SupabaseClient } from '@supabase/supabase-js';
import type { Goal, GoalProgress, GoalMetric, GrowthSource } from '@/lib/types/tools';
import { GOAL_METRIC_META } from '@/lib/types/tools';

/**
 * Busca o valor atual da metrica da meta.
 */
export async function getCurrentMetricValue(
  userId: string,
  metric: GoalMetric,
  supabase: SupabaseClient
): Promise<number | null> {
  const source: GrowthSource = GOAL_METRIC_META[metric].source;
  const { data } = await supabase
    .from('growth_snapshots')
    .select('metric_value, snapshot_date')
    .eq('user_id', userId)
    .eq('source', source)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.metric_value ?? null;
}

/**
 * Calcula ritmo semanal de crescimento baseado nas ultimas N semanas.
 */
async function getWeeklyGrowthRate(
  userId: string,
  metric: GoalMetric,
  supabase: SupabaseClient,
  weeksBack: number = 4
): Promise<number | null> {
  const source: GrowthSource = GOAL_METRIC_META[metric].source;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7 - 3); // tolerancia
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const { data } = await supabase
    .from('growth_snapshots')
    .select('metric_value, snapshot_date')
    .eq('user_id', userId)
    .eq('source', source)
    .gte('snapshot_date', cutoffISO)
    .order('snapshot_date', { ascending: true });

  if (!data || data.length < 2) return null;

  const oldest = data[0];
  const newest = data[data.length - 1];
  const daysDiff = (new Date(newest.snapshot_date).getTime() - new Date(oldest.snapshot_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff < 1) return null;

  const totalGrowth = newest.metric_value - oldest.metric_value;
  return (totalGrowth / daysDiff) * 7; // crescimento semanal
}

/**
 * Calcula progresso completo da meta.
 */
export async function calculateGoalProgress(goal: Goal, supabase: SupabaseClient): Promise<GoalProgress> {
  const current = await getCurrentMetricValue(goal.user_id, goal.metric, supabase);
  const actualPerWeek = await getWeeklyGrowthRate(goal.user_id, goal.metric, supabase);

  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const createdAt = new Date(goal.created_at);
  const targetDate = new Date(goal.target_date + 'T12:00:00');

  const daysElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const totalNeeded = goal.target_value - goal.start_value;
  const progressSoFar = current !== null ? current - goal.start_value : 0;
  const progressPct = totalNeeded > 0 ? (progressSoFar / totalNeeded) * 100 : 0;

  const weeksRemaining = Math.max(0.1, daysRemaining / 7);
  const remainingNeeded = current !== null ? Math.max(0, goal.target_value - current) : totalNeeded;
  const requiredPerWeek = Math.min(remainingNeeded / weeksRemaining, 1e9); // cap to avoid Infinity

  let projectedEta: string | null = null;
  if (actualPerWeek !== null && actualPerWeek > 0 && current !== null && current < goal.target_value) {
    const weeksToTarget = (goal.target_value - current) / actualPerWeek;
    const eta = new Date(now);
    eta.setDate(eta.getDate() + Math.ceil(weeksToTarget * 7));
    projectedEta = eta.toISOString().slice(0, 10);
  }

  // Status
  let status: GoalProgress['status'];
  if (current !== null && current >= goal.target_value) {
    status = 'achieved';
  } else if (actualPerWeek === null) {
    status = 'tight'; // sem dados ainda
  } else if (actualPerWeek >= requiredPerWeek) {
    status = 'on_track';
  } else if (actualPerWeek >= requiredPerWeek * 0.7) {
    status = 'tight';
  } else {
    status = 'behind';
  }

  // Recomendacao
  let recommendation: string;
  const metricLabel = GOAL_METRIC_META[goal.metric].label.toLowerCase();
  if (status === 'achieved') {
    recommendation = `Você bateu a meta! Considere definir uma próxima mais ambiciosa.`;
  } else if (status === 'on_track') {
    recommendation = `Ritmo atual de ${Math.round(actualPerWeek!)} ${metricLabel}/semana. Mantém isso e bate a meta no prazo.`;
  } else if (status === 'tight' && actualPerWeek !== null) {
    const deficit = Math.round(requiredPerWeek - actualPerWeek);
    recommendation = `Apertado. Precisa de ${Math.round(requiredPerWeek)}/sem, está em ${Math.round(actualPerWeek)}. Falta ~${deficit}/sem pra entrar no ritmo.`;
  } else if (status === 'behind' && actualPerWeek !== null) {
    const needed = Math.round(requiredPerWeek);
    recommendation = `Ritmo atual não bate a meta no prazo. Precisa quase dobrar pra ${needed}/sem. Considere ajustar data ou intensificar ações.`;
  } else {
    recommendation = `Ainda sem dados de crescimento suficientes. Volta depois de 2 semanas de snapshots.`;
  }

  return {
    goal,
    current_value: current,
    progress_pct: Math.max(0, Math.min(100, progressPct)),
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    required_per_week: Math.round(requiredPerWeek),
    actual_per_week: actualPerWeek !== null ? Math.round(actualPerWeek) : null,
    projected_eta: projectedEta,
    status,
    recommendation,
  };
}
