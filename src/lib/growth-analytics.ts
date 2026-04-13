import { getServerSupabase } from "./auth";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FunnelMetrics {
  period: { start: string; end: string };
  visitors: number;
  signups: number;
  activations: number;
  conversions: number;
  rates: {
    visitor_to_signup: number;
    signup_to_activation: number;
    activation_to_conversion: number;
    overall: number;
  };
}

export interface FeatureUsage {
  feature_name: string;
  usage_count: number;
  unique_users: number;
}

export interface RetentionCohort {
  cohort_month: string;
  cohort_size: number;
  retention: Record<string, number>; // "month_1": 0.85, "month_2": 0.72, etc.
}

export interface AICostEstimate {
  period_days: number;
  total_generations: number;
  estimated_cost_usd: number;
  breakdown: {
    model: string;
    count: number;
    estimated_cost_usd: number;
  }[];
  daily_average_cost_usd: number;
}

export interface ChurnRateResult {
  period_days: number;
  active_at_start: number;
  canceled_during_period: number;
  churn_rate: number;
  monthly_churn_rate: number;
}

export interface RevenueMetrics {
  mrr: number;
  active_subscriptions: number;
  arpu: number;
  growth_rate: number | null;
  by_plan: {
    plan: string;
    count: number;
    mrr: number;
  }[];
}

// ── Price mapping ──────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  pro: 29.9,
  business: 79.9,
};

const AI_COST_PER_GENERATION: Record<string, number> = {
  haiku: 0.003,
  sonnet: 0.015,
};

// ── Funnel Metrics ─────────────────────────────────────────────────────────────

export async function getFunnelMetrics(
  startDate: string,
  endDate: string
): Promise<FunnelMetrics> {
  const supabase = getServerSupabase();

  // Visitors: page_view events on landing pages
  const { count: visitors } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("event_category", "page_view")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Signups: new users created in the period
  const { count: signups } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Activations: users who completed their profile (onboarding event)
  const { count: activations } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("event_name", "profile_completed")
    .eq("event_category", "auth")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // Conversions: new paid subscriptions created in the period
  const { count: conversions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const v = visitors || 0;
  const s = signups || 0;
  const a = activations || 0;
  const c = conversions || 0;

  return {
    period: { start: startDate, end: endDate },
    visitors: v,
    signups: s,
    activations: a,
    conversions: c,
    rates: {
      visitor_to_signup: v > 0 ? Math.round((s / v) * 10000) / 100 : 0,
      signup_to_activation: s > 0 ? Math.round((a / s) * 10000) / 100 : 0,
      activation_to_conversion: a > 0 ? Math.round((c / a) * 10000) / 100 : 0,
      overall: v > 0 ? Math.round((c / v) * 10000) / 100 : 0,
    },
  };
}

// ── Feature Usage Ranking ──────────────────────────────────────────────────────

export async function getFeatureUsageRanking(
  days: number
): Promise<FeatureUsage[]> {
  const supabase = getServerSupabase();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch all feature_use events in the period
  const { data: events } = await supabase
    .from("events")
    .select("event_name, user_id")
    .eq("event_category", "feature_use")
    .gte("created_at", since);

  if (!events || events.length === 0) return [];

  // Aggregate in-memory: count total usage and unique users per feature
  const featureMap = new Map<
    string,
    { count: number; users: Set<string> }
  >();

  for (const event of events) {
    const name = event.event_name;
    if (!featureMap.has(name)) {
      featureMap.set(name, { count: 0, users: new Set() });
    }
    const entry = featureMap.get(name)!;
    entry.count++;
    if (event.user_id) {
      entry.users.add(event.user_id);
    }
  }

  const ranked: FeatureUsage[] = Array.from(featureMap.entries())
    .map(([feature_name, { count, users }]) => ({
      feature_name,
      usage_count: count,
      unique_users: users.size,
    }))
    .sort((a, b) => b.usage_count - a.usage_count);

  return ranked;
}

// ── Retention Cohorts ──────────────────────────────────────────────────────────

export async function getRetentionCohorts(
  months: number
): Promise<RetentionCohort[]> {
  const supabase = getServerSupabase();
  const now = new Date();
  const cohorts: RetentionCohort[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(
      cohortStart.getFullYear(),
      cohortStart.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const cohortMonth = cohortStart.toISOString().slice(0, 7); // "2026-01"

    // Get users who signed up in this cohort month
    const { data: cohortUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", cohortStart.toISOString())
      .lte("created_at", cohortEnd.toISOString());

    if (!cohortUsers || cohortUsers.length === 0) {
      cohorts.push({ cohort_month: cohortMonth, cohort_size: 0, retention: {} });
      continue;
    }

    const userIds = cohortUsers.map((u) => u.id);
    const cohortSize = userIds.length;
    const retention: Record<string, number> = {};

    // For each subsequent month, check how many users had activity
    const monthsElapsed = i; // how many months ago this cohort was
    for (let m = 1; m <= monthsElapsed; m++) {
      const periodStart = new Date(
        cohortStart.getFullYear(),
        cohortStart.getMonth() + m,
        1
      );
      const periodEnd = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // Count distinct users from this cohort who had events in the period
      const { data: activeEvents } = await supabase
        .from("events")
        .select("user_id")
        .in("user_id", userIds)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      const activeUsers = new Set(
        (activeEvents || []).map((e) => e.user_id)
      ).size;

      retention[`month_${m}`] =
        Math.round((activeUsers / cohortSize) * 10000) / 100;
    }

    cohorts.push({ cohort_month: cohortMonth, cohort_size: cohortSize, retention });
  }

  return cohorts;
}

// ── AI Cost Estimate ───────────────────────────────────────────────────────────

export async function getAICostEstimate(
  days: number
): Promise<AICostEstimate> {
  const supabase = getServerSupabase();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch all AI generation events
  const { data: events } = await supabase
    .from("events")
    .select("event_name, properties")
    .eq("event_category", "ai_generation")
    .gte("created_at", since);

  if (!events || events.length === 0) {
    return {
      period_days: days,
      total_generations: 0,
      estimated_cost_usd: 0,
      breakdown: [],
      daily_average_cost_usd: 0,
    };
  }

  // Group by model from properties, default to sonnet if unspecified
  const modelCounts = new Map<string, number>();

  for (const event of events) {
    const props = (event.properties as Record<string, unknown>) || {};
    const model = String(props.model || "sonnet").toLowerCase();
    const key = model.includes("haiku") ? "haiku" : "sonnet";
    modelCounts.set(key, (modelCounts.get(key) || 0) + 1);
  }

  const breakdown = Array.from(modelCounts.entries()).map(([model, count]) => ({
    model,
    count,
    estimated_cost_usd:
      Math.round(count * (AI_COST_PER_GENERATION[model] || 0.015) * 1000) /
      1000,
  }));

  const totalCost = breakdown.reduce((sum, b) => sum + b.estimated_cost_usd, 0);

  return {
    period_days: days,
    total_generations: events.length,
    estimated_cost_usd: Math.round(totalCost * 100) / 100,
    breakdown,
    daily_average_cost_usd:
      days > 0 ? Math.round((totalCost / days) * 100) / 100 : 0,
  };
}

// ── Churn Rate ─────────────────────────────────────────────────────────────────

export async function getChurnRate(days: number): Promise<ChurnRateResult> {
  const supabase = getServerSupabase();
  const periodStart = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  // Active subscriptions at the start of the period:
  // subscriptions created before the period that were active or trialing
  const { count: activeAtStart } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .lte("created_at", periodStart)
    .in("status", ["active", "trialing", "canceled", "past_due"]);

  // Canceled during the period
  const { count: canceledDuringPeriod } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .not("canceled_at", "is", null)
    .gte("canceled_at", periodStart);

  const active = activeAtStart || 0;
  const canceled = canceledDuringPeriod || 0;

  const churnRate = active > 0 ? Math.round((canceled / active) * 10000) / 100 : 0;
  // Normalize to monthly rate
  const monthlyChurnRate =
    days > 0 ? Math.round((churnRate / days) * 30 * 100) / 100 : 0;

  return {
    period_days: days,
    active_at_start: active,
    canceled_during_period: canceled,
    churn_rate: churnRate,
    monthly_churn_rate: monthlyChurnRate,
  };
}

// ── Revenue Metrics ────────────────────────────────────────────────────────────

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = getServerSupabase();

  // Current active subscriptions
  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("user_id, product, status, created_at")
    .in("status", ["active", "trialing"]);

  if (!activeSubs || activeSubs.length === 0) {
    return {
      mrr: 0,
      active_subscriptions: 0,
      arpu: 0,
      growth_rate: null,
      by_plan: [],
    };
  }

  // Calculate MRR by plan
  const planMap = new Map<string, { count: number; mrr: number }>();

  for (const sub of activeSubs) {
    const plan = sub.product || "free";
    const price = PLAN_PRICES[plan] || 0;
    if (!planMap.has(plan)) {
      planMap.set(plan, { count: 0, mrr: 0 });
    }
    const entry = planMap.get(plan)!;
    entry.count++;
    entry.mrr += price;
  }

  const byPlan = Array.from(planMap.entries()).map(([plan, data]) => ({
    plan,
    count: data.count,
    mrr: Math.round(data.mrr * 100) / 100,
  }));

  const totalMrr = byPlan.reduce((sum, p) => sum + p.mrr, 0);
  const activeCount = activeSubs.length;
  const arpu = activeCount > 0 ? Math.round((totalMrr / activeCount) * 100) / 100 : 0;

  // Growth rate: compare current month's new subs vs previous month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const { count: thisMonthNew } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "trialing"])
    .gte("created_at", thisMonthStart);

  const { count: lastMonthNew } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "trialing"])
    .gte("created_at", lastMonthStart)
    .lte("created_at", lastMonthEnd);

  const prev = lastMonthNew || 0;
  const curr = thisMonthNew || 0;

  const growthRate =
    prev > 0
      ? Math.round(((curr - prev) / prev) * 10000) / 100
      : null;

  return {
    mrr: Math.round(totalMrr * 100) / 100,
    active_subscriptions: activeCount,
    arpu,
    growth_rate: growthRate,
    by_plan: byPlan,
  };
}
