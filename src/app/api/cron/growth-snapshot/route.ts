import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureAutomaticSnapshots, generateWeeklyInsight, getGrowthDashboardData } from '@/lib/growth-aggregator';
import type { GrowthProfile, GrowthDashboardData, GrowthSource } from '@/lib/types/tools';
import { GROWTH_SOURCE_META } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * Cron semanal: roda toda segunda 8h BRT.
 * Pode ser acionado por:
 *  - Cloudflare Cron Trigger (recomendado) -> passar CRON_SECRET via header
 *  - GitHub Actions, servico externo, etc.
 *
 * Protegido por secret simples. NAO expor sem essa protecao.
 */

function renderEmailHTML(args: {
  artistName: string;
  data: GrowthDashboardData;
  insight: string;
  dashboardUrl: string;
}): string {
  const { artistName, data, insight, dashboardUrl } = args;
  const rows = (['spotify', 'youtube', 'instagram', 'tiktok'] as GrowthSource[])
    .filter((s) => data.current[s] !== null)
    .map((s) => {
      const value = data.current[s] ?? 0;
      const delta = data.delta_pct[s];
      const deltaStr = delta !== null
        ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
        : '—';
      const deltaColor = delta === null ? '#737373' : delta > 0 ? '#00f5a0' : delta < 0 ? '#ff6b6b' : '#737373';
      return `
        <tr>
          <td style="padding: 14px 20px; border-bottom: 1px solid #262626; color: #d4d4d4; font-size: 14px;">${GROWTH_SOURCE_META[s].label}</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #262626; color: #f5f5f5; font-size: 18px; font-weight: 700; text-align: right;">${value.toLocaleString('pt-BR')}</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #262626; color: ${deltaColor}; font-size: 14px; font-weight: 600; text-align: right; font-family: 'SFMono-Regular', Monaco, monospace;">${deltaStr}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Seu Growth Tracker - Verelus</title></head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 30px 20px;">
    <tr><td>
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #f5f5f5; font-size: 28px; margin: 0; letter-spacing: -0.5px;">Verelus</h1>
        <p style="color: #00f5a0; font-size: 11px; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Growth Tracker semanal</p>
      </div>

      <div style="background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); padding: 2px; border-radius: 16px; margin-bottom: 20px;">
        <div style="background: #0a0a0a; border-radius: 14px; padding: 28px;">
          <p style="color: #ffa500; font-size: 11px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">Leitura da semana</p>
          <p style="color: #e5e5e5; font-size: 15px; line-height: 1.7; margin: 0;">${insight.replace(/\n/g, '<br>')}</p>
        </div>
      </div>

      <div style="background: #0a0a0a; border: 1px solid #262626; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 14px 20px; background: #171717; color: #737373; font-size: 10px; text-align: left; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Plataforma</th>
              <th style="padding: 14px 20px; background: #171717; color: #737373; font-size: 10px; text-align: right; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Atual</th>
              <th style="padding: 14px 20px; background: #171717; color: #737373; font-size: 10px; text-align: right; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Semana</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffa500, #ff8c00); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
          Ver dashboard completo
        </a>
      </div>

      <div style="text-align: center; border-top: 1px solid #262626; padding-top: 20px;">
        <p style="color: #525252; font-size: 11px; margin: 0; line-height: 1.6;">
          Voce esta recebendo porque o Growth Tracker esta ativo.<br>
          <a href="${dashboardUrl}" style="color: #737373; text-decoration: underline;">Configurar em verelus.com</a>
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWeeklyEmail(args: {
  email: string;
  artistName: string;
  data: GrowthDashboardData;
  insight: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verelus.com';
  const dashboardUrl = `${appUrl}/dashboard/growth`;
  const html = renderEmailHTML({ artistName: args.artistName, data: args.data, insight: args.insight, dashboardUrl });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Verelus <growth@verelus.com>',
        to: [args.email],
        subject: 'Seu Growth Tracker dessa semana',
        html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('email error:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Autenticacao via secret
  const providedSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pega todos os profiles ativos
    const { data: profiles } = await supabase
      .from('growth_profiles')
      .select(`*, users!inner(email)`)
      .eq('enabled', true);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No active profiles' });
    }

    const results: Array<{ user_id: string; captured: string[]; email_sent: boolean; errors: string[] }> = [];

    for (const row of profiles) {
      const profile: GrowthProfile = {
        user_id: row.user_id,
        spotify_artist_url: row.spotify_artist_url ?? undefined,
        youtube_channel_id: row.youtube_channel_id ?? undefined,
        youtube_channel_url: row.youtube_channel_url ?? undefined,
        instagram_handle: row.instagram_handle ?? undefined,
        tiktok_handle: row.tiktok_handle ?? undefined,
        enabled: row.enabled,
      };

      const userEmail = (row as unknown as { users: { email: string } }).users.email;

      try {
        const { captured, errors } = await captureAutomaticSnapshots(profile, supabase);
        const data = await getGrowthDashboardData(profile.user_id, supabase);

        let insight = '';
        try {
          insight = await generateWeeklyInsight(data);
        } catch (err) {
          console.error(`insight error for ${profile.user_id}:`, err);
        }

        if (insight) {
          await supabase
            .from('growth_profiles')
            .update({ weekly_insight: insight, last_cron_run_at: new Date().toISOString() })
            .eq('user_id', profile.user_id);
        }

        const emailSent = await sendWeeklyEmail({
          email: userEmail,
          artistName: 'artista',
          data,
          insight: insight || 'Ainda sem comparativo. Semana que vem ja da pra ver evolucao.',
        });

        results.push({
          user_id: profile.user_id,
          captured: Object.keys(captured),
          email_sent: emailSent,
          errors,
        });
      } catch (err) {
        results.push({
          user_id: profile.user_id,
          captured: [],
          email_sent: false,
          errors: [err instanceof Error ? err.message : 'erro'],
        });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error('cron growth error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}

// GET para facilitar teste manual (mesma autenticacao)
export async function GET(req: NextRequest) {
  return POST(req);
}
