import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getGrowthDashboardData } from '@/lib/growth-aggregator';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const data = await getGrowthDashboardData(userId, supabase);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('dashboard error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
