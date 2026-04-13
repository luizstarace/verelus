export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import {
  getFunnelMetrics,
  getFeatureUsageRanking,
  getRetentionCohorts,
  getAICostEstimate,
  getChurnRate,
  getRevenueMetrics,
} from "@/lib/growth-analytics";

/**
 * POST /api/analytics/weekly
 *
 * Collects all growth metrics, generates strategic recommendations via Claude,
 * and sends a formatted report to FOUNDER_EMAIL via Resend.
 * Protected by service role key.
 */
export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: service role key not set" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const serviceKeyHeader = request.headers.get("x-service-key");
  const providedKey = authHeader?.replace("Bearer ", "") || serviceKeyHeader;

  if (providedKey !== serviceKey) {
    return NextResponse.json(
      { error: "Unauthorized: invalid service key" },
      { status: 401 }
    );
  }

  // ── Collect metrics ─────────────────────────────────────────────────────────
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const endDate = now.toISOString();

    const [funnel, featureUsage, retention, aiCost, churn, revenue] =
      await Promise.all([
        getFunnelMetrics(sevenDaysAgo, endDate),
        getFeatureUsageRanking(7),
        getRetentionCohorts(6),
        getAICostEstimate(7),
        getChurnRate(30),
        getRevenueMetrics(),
      ]);

    const metrics = { funnel, featureUsage, retention, aiCost, churn, revenue };

    // ── Generate AI recommendations ─────────────────────────────────────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const metricsJson = JSON.stringify(metrics, null, 2);

    let reportContent = "Relatorio indisponivel — ANTHROPIC_API_KEY nao configurada.";

    if (anthropicKey) {
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `Voce e o Growth Analyst do Verelus, uma plataforma SaaS de inteligencia musical com IA para artistas independentes brasileiros. Planos: Free, Pro (R$29,90/mes), Business (R$79,90/mes).

Aqui estao as metricas da ultima semana e do ultimo mes:

${metricsJson}

Com base nesses dados, gere um relatorio estrategico COMPLETO em portugues brasileiro com as seguintes secoes:

## 1. Analise do Funil de Conversao
- Identifique gargalos no funil (visitante → signup → ativacao → conversao)
- Compare as taxas com benchmarks SaaS (visitor-to-signup: 2-5%, signup-to-activation: 20-40%, activation-to-conversion: 3-10%)
- Sugira acoes especificas para melhorar cada etapa

## 2. Features para Priorizar
- Analise o ranking de uso de features
- Identifique features subutilizadas que podem ter potencial
- Recomende o que desenvolver/melhorar em seguida baseado nos dados

## 3. Sugestoes de Pricing
- Analise ARPU, distribuicao por plano e growth rate
- Sugira ajustes de pricing ou novas estrategias de monetizacao
- Considere o mercado brasileiro de musicos independentes

## 4. Acoes de Growth Recomendadas
- Liste 5 acoes concretas priorizadas por impacto e facilidade
- Inclua metricas-alvo para cada acao
- Considere retencao, aquisicao e monetizacao

## 5. Riscos Identificados
- Analise churn rate e tendencias de retencao por coorte
- Identifique custo de IA vs receita
- Alerte sobre qualquer metrica preocupante

## 6. Resumo Executivo (3 bullet points)
- O mais importante que precisa de atencao esta semana

Seja direto, use numeros, e foque em acoes que um founder solo pode executar.`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        reportContent = aiData.content?.[0]?.text || "Erro ao processar resposta da IA.";
      }
    }

    // ── Send email via Resend ───────────────────────────────────────────────
    const founderEmail = process.env.FOUNDER_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    let emailSent = false;

    if (founderEmail && resendKey) {
      const weekNumber = getWeekNumber(now);
      const formattedDate = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Verelus Analytics <analytics@verelus.com>",
          to: [founderEmail],
          subject: `[Verelus] Relatorio Semanal de Growth #${weekNumber} — ${formattedDate}`,
          html: buildReportEmail(reportContent, metrics, weekNumber),
        }),
      });

      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      email_sent: emailSent,
      metrics,
      report: reportContent,
      generated_at: now.toISOString(),
    });
  } catch (error) {
    console.error("[analytics/weekly] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weekly report",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7);
}

function buildReportEmail(
  reportContent: string,
  metrics: Record<string, unknown>,
  weekNumber: number
): string {
  // Convert markdown-style headers to HTML
  const htmlContent = reportContent
    .replace(/^## (.+)$/gm, '<h2 style="color: #00ff88; margin-top: 24px;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color: #a855f7; margin-top: 16px;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/\n\n/g, "</p><p>")
    .replace(
      /(<li[^>]*>.*<\/li>\n?)+/g,
      '<ul style="padding-left: 20px;">$&</ul>'
    );

  const funnel = metrics.funnel as Record<string, unknown> | undefined;
  const revenue = metrics.revenue as Record<string, unknown> | undefined;
  const churn = metrics.churn as Record<string, unknown> | undefined;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verelus Growth Report #${weekNumber}</title>
</head>
<body style="margin:0;padding:0;background:#050508;font-family:'Inter',-apple-system,sans-serif;">
  <div style="max-width:700px;margin:0 auto;background:#0a0a0f;">
    <div style="padding:32px 24px;text-align:center;border-bottom:1px solid #1e1e2e;">
      <div style="font-size:11px;font-family:monospace;color:#00ff88;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);display:inline-block;padding:4px 12px;border-radius:20px;margin-bottom:8px;">
        Growth Report #${weekNumber}
      </div>
      <div style="font-size:24px;font-weight:900;">
        <span style="color:#00ff88;">Ver</span><span style="color:#a855f7;">el</span><span style="color:#ff6b35;">us</span>
      </div>
      <p style="color:#52525b;font-size:13px;margin:8px 0 0 0;">Relatorio Semanal de Growth</p>
    </div>

    <!-- Quick Stats -->
    <div style="padding:24px;display:flex;gap:12px;border-bottom:1px solid #1e1e2e;">
      <div style="flex:1;background:#12121a;border:1px solid #1e1e2e;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#52525b;font-size:11px;text-transform:uppercase;">MRR</div>
        <div style="color:#00ff88;font-size:24px;font-weight:700;">R$${revenue?.mrr ?? "—"}</div>
      </div>
      <div style="flex:1;background:#12121a;border:1px solid #1e1e2e;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#52525b;font-size:11px;text-transform:uppercase;">Signups</div>
        <div style="color:#a855f7;font-size:24px;font-weight:700;">${(funnel as Record<string, unknown>)?.signups ?? "—"}</div>
      </div>
      <div style="flex:1;background:#12121a;border:1px solid #1e1e2e;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#52525b;font-size:11px;text-transform:uppercase;">Churn</div>
        <div style="color:#ff6b35;font-size:24px;font-weight:700;">${churn?.monthly_churn_rate ?? "—"}%</div>
      </div>
    </div>

    <!-- Report Content -->
    <div style="padding:32px 24px;color:#a1a1aa;font-size:15px;line-height:1.7;">
      ${htmlContent}
    </div>

    <div style="padding:24px;text-align:center;border-top:1px solid #1e1e2e;">
      <p style="color:#52525b;font-size:12px;margin:4px 0;">
        Gerado automaticamente por Verelus Growth Analyst
      </p>
      <p style="color:#52525b;font-size:12px;margin:4px 0;">
        &copy; 2026 Verelus. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
}
