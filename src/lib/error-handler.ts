import { NextRequest, NextResponse } from 'next/server';
import { trackError } from './tracking';

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Wraps API route handlers with automatic error catching and logging.
 * Usage: export const POST = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(handler: RouteHandler, endpoint?: string): RouteHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      // Log to console for server logs
      console.error(`[BugHunter] ${endpoint || req.url}:`, error);

      const severity = categorizeError(error);

      // Log to database
      await trackError(
        'api_error',
        message,
        stack,
        endpoint || new URL(req.url).pathname,
        undefined,
        severity
      ).catch(() => {}); // Don't let logging failure crash the response

      // Notify if critical
      if (severity === 'critical') {
        await notifyDiscord(message, endpoint || req.url).catch(() => {});
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

function categorizeError(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('supabase') || lower.includes('database')) return 'critical';
  if (lower.includes('stripe') || lower.includes('payment')) return 'critical';
  if (lower.includes('auth') || lower.includes('unauthorized')) return 'high';
  if (lower.includes('rate limit') || lower.includes('429')) return 'medium';
  return 'medium';
}

async function notifyDiscord(message: string, endpoint: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: 'Critical Error - Verelus',
        color: 0xff0000,
        fields: [
          { name: 'Endpoint', value: endpoint, inline: true },
          { name: 'Error', value: message.slice(0, 1024) },
          { name: 'Time', value: new Date().toISOString(), inline: true },
        ],
      }],
    }),
  });
}

export { categorizeError, notifyDiscord };
