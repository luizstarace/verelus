import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { calculateGoalProgress } from '@/lib/goal-calculator';
import type { Goal, GoalProgress } from '@/lib/types/tools';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const progresses: GoalProgress[] = [];
    for (const g of (goals ?? []) as Goal[]) {
      progresses.push(await calculateGoalProgress(g, supabase));
    }

    return NextResponse.json({ goals: progresses });
  } catch (err) {
    console.error('goals list error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
