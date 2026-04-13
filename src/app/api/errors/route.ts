import { NextRequest, NextResponse } from 'next/server';
import { trackError } from '@/lib/tracking';

export const runtime = 'edge';

// In-memory rate limiting: map of IP -> timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5; // max errors per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Remove entries outside the window
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    rateLimitMap.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limited. Max 5 errors per minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, stack, url, componentName, severity } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const safeSeverity = validSeverities.includes(severity) ? severity : 'medium';

    await trackError(
      'client_error',
      message.slice(0, 2000), // Limit message length
      stack?.slice(0, 5000),
      url || undefined,
      undefined,
      safeSeverity,
      {
        ipAddress: ip,
        requestBody: componentName ? { componentName } : undefined,
      }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[BugHunter] Failed to log client error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
