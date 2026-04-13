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
 * GET /api/analytics/dashboard
 *
 * Returns all growth metrics for an admin dashboard.
 * Protected by service role key via Authorization header or x-service-key header.
 */
export async function GET(request: NextRequest) {
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

  // ── Query params ────────────────────────────────────────────────────────────
  const url = new URL(request.url);
  const funnelDays = parseInt(url.searchParams.get("funnel_days") || "7", 10);
  const featureDays = parseInt(url.searchParams.get("feature_days") || "30", 10);
  const retentionMonths = parseInt(url.searchParams.get("retention_months") || "6", 10);
  const aiCostDays = parseInt(url.searchParams.get("ai_cost_days") || "30", 10);
  const churnDays = parseInt(url.searchParams.get("churn_days") || "30", 10);

  try {
    const now = new Date();
    const startDate = new Date(
      now.getTime() - funnelDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const endDate = now.toISOString();

    const [funnel, featureUsage, retention, aiCost, churn, revenue] =
      await Promise.all([
        getFunnelMetrics(startDate, endDate),
        getFeatureUsageRanking(featureDays),
        getRetentionCohorts(retentionMonths),
        getAICostEstimate(aiCostDays),
        getChurnRate(churnDays),
        getRevenueMetrics(),
      ]);

    return NextResponse.json({
      funnel,
      feature_usage: featureUsage,
      retention,
      ai_cost: aiCost,
      churn,
      revenue,
      generated_at: now.toISOString(),
    });
  } catch (error) {
    console.error("[analytics/dashboard] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics dashboard",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
