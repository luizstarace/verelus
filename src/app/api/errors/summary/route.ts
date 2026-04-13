import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // Require service role key for security
  const authHeader = req.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const now = new Date();

  const ranges = {
    last_24h: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    last_7d: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_30d: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    // Fetch all errors from the last 30 days in one query
    const { data: errors, error } = await supabase
      .from('error_logs')
      .select('error_type, severity, endpoint, created_at')
      .gte('created_at', ranges.last_30d)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BugHunter] Failed to fetch error summary:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch error summary' },
        { status: 500 }
      );
    }

    const allErrors = errors || [];

    // Helper to filter by time range
    const inRange = (createdAt: string, since: string) =>
      new Date(createdAt).getTime() >= new Date(since).getTime();

    // Build counts per time range
    const buildCounts = (since: string) => {
      const filtered = allErrors.filter((e) => inRange(e.created_at, since));

      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byEndpoint: Record<string, number> = {};

      for (const e of filtered) {
        byType[e.error_type] = (byType[e.error_type] || 0) + 1;
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
        if (e.endpoint) {
          byEndpoint[e.endpoint] = (byEndpoint[e.endpoint] || 0) + 1;
        }
      }

      return {
        total: filtered.length,
        by_type: byType,
        by_severity: bySeverity,
        by_endpoint: byEndpoint,
      };
    };

    const summary = {
      generated_at: now.toISOString(),
      last_24h: buildCounts(ranges.last_24h),
      last_7d: buildCounts(ranges.last_7d),
      last_30d: buildCounts(ranges.last_30d),
    };

    return NextResponse.json(summary, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[BugHunter] Error summary failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
