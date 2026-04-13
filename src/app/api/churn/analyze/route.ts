export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';
import { analyzeChurnRisk } from '@/lib/churn-detection';

/**
 * GET /api/churn/analyze
 *
 * Returns churn risk analysis for all paying users.
 * Protected by service role key via Authorization header or x-service-key header.
 */
export async function GET(request: NextRequest) {
  // Authenticate with service role key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: service role key not set' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const serviceKeyHeader = request.headers.get('x-service-key');
  const providedKey = authHeader?.replace('Bearer ', '') || serviceKeyHeader;

  if (providedKey !== serviceKey) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid service key' },
      { status: 401 }
    );
  }

  try {
    const riskUsers = await analyzeChurnRisk();

    const summary = {
      total: riskUsers.length,
      critical: riskUsers.filter((u) => u.risk_level === 'critical').length,
      high: riskUsers.filter((u) => u.risk_level === 'high').length,
      medium: riskUsers.filter((u) => u.risk_level === 'medium').length,
      low: riskUsers.filter((u) => u.risk_level === 'low').length,
    };

    return NextResponse.json({ risk_users: riskUsers, summary });
  } catch (error) {
    console.error('[churn/analyze] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze churn risk', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
