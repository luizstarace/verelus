export const runtime = "edge";

import { NextResponse } from "next/server";
import { collectBriefingData, formatBriefingEmail } from "@/lib/briefing";

/**
 * POST /api/briefing/daily
 *
 * Collects daily metrics and sends a briefing email to the founder.
 * Protected by service role key — intended to be called by a cron job.
 */
export async function POST(request: Request) {
  // Authenticate with service role key
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Collect all briefing data
    const data = await collectBriefingData();
    const emailHtml = formatBriefingEmail(data);

    // Send email via Resend
    const founderEmail = process.env.FOUNDER_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (founderEmail && resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Verelus <briefing@verelus.com>",
          to: [founderEmail],
          subject: `Verelus Daily Briefing - ${new Date().toLocaleDateString("pt-BR")}`,
          html: emailHtml,
        }),
      });

      if (!emailRes.ok) {
        const errorBody = await emailRes.text();
        console.error("[briefing] Failed to send email:", errorBody);
      }
    } else {
      console.warn("[briefing] FOUNDER_EMAIL or RESEND_API_KEY not configured, skipping email");
    }

    // Send to Discord webhook if configured
    const discordWebhook = process.env.DISCORD_BRIEFING_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

    if (discordWebhook) {
      const mrr = data.subscriptions.pro * 97 + data.subscriptions.business * 297;

      const discordMessage = [
        `**Verelus Daily Briefing** - ${new Date().toLocaleDateString("pt-BR")}`,
        "",
        `**Usuarios:** ${data.users.total} total | +${data.users.new_today} hoje | ${data.users.active_today} ativos`,
        `**MRR Estimado:** R$ ${mrr.toLocaleString("pt-BR")}`,
        `**Assinantes:** ${data.subscriptions.total_active} ativos (${data.subscriptions.pro} Pro, ${data.subscriptions.business} Business)`,
        `**Novos hoje:** +${data.subscriptions.new_today} | Cancelamentos: ${data.subscriptions.canceled_today}`,
        `**IA:** ${data.ai_usage.generations_today} geracoes hoje | ${data.ai_usage.generations_week} na semana`,
        `**Engajamento:** ${data.engagement.page_views_today} views | ${data.engagement.feature_uses_today} features`,
        data.errors.total_24h > 0
          ? `**Erros 24h:** ${data.errors.total_24h} total | ${data.errors.critical} criticos | ${data.errors.unresolved} nao resolvidos`
          : `**Erros 24h:** Nenhum`,
      ].join("\n");

      await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: discordMessage }),
      }).catch((err) => {
        console.error("[briefing] Failed to send Discord notification:", err);
      });
    }

    return NextResponse.json({
      success: true,
      data,
      email_sent: !!(founderEmail && resendKey),
      discord_sent: !!discordWebhook,
    });
  } catch (error) {
    console.error("[briefing] Error collecting briefing data:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing", details: String(error) },
      { status: 500 }
    );
  }
}
