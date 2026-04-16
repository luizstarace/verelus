import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getComparisonDashboard, generateComparisonInsight } from '@/lib/competitor-aggregator';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const dashboard = await getComparisonDashboard(userId, supabase);

    // Gera insight se ha pelo menos 1 competidor
    if (dashboard.competitors.length > 0) {
      try {
        dashboard.insight = await generateComparisonInsight(dashboard);
      } catch {
        // insight opcional
      }
    }

    return NextResponse.json({ dashboard });
  } catch (err) {
    console.error('competitors list error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
