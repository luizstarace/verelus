export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com';

  try {
    // Call health check endpoint
    const res = await fetch(`${appUrl}/api/health/atalaia`);
    const data = await res.json();

    if (data.status === 'healthy') {
      return NextResponse.json({ status: 'ok', checks: data.checks });
    }

    // Degraded — send alert email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const failedChecks = Object.entries(data.checks || {})
        .filter(([, v]: [string, any]) => !v.ok)
        .map(([k, v]: [string, any]) => `${k}: ${v.error || 'failed'} (${v.latency_ms}ms)`)
        .join('<br/>');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Atalaia Monitor <atalaia@verelus.com>',
          to: [process.env.FOUNDER_EMAIL || 'luizsfap@gmail.com'],
          subject: `[ALERT] Atalaia health check: ${data.status}`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
              <h2 style="color:#ef4444;">Atalaia Health Degraded</h2>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Timestamp:</strong> ${data.timestamp}</p>
              <p><strong>Failed checks:</strong></p>
              <p>${failedChecks}</p>
              <a href="${appUrl}/api/health/atalaia" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Check now →</a>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ status: 'alert_sent', health: data.status });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
