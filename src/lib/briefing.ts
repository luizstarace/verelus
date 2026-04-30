import { getServerSupabase } from "./auth";

export interface DailyBriefingData {
  date: string;
  users: {
    total: number;
    new_today: number;
    new_week: number;
    active_today: number;
  };
  subscriptions: {
    total_active: number;
    pro: number;
    business: number;
    free: number;
    new_today: number;
    canceled_today: number;
    past_due: number;
  };
  ai_usage: {
    generations_today: number;
    generations_week: number;
    top_types: { type: string; count: number }[];
  };
  errors: {
    total_24h: number;
    critical: number;
    high: number;
    unresolved: number;
    top_endpoints: { endpoint: string; count: number }[];
  };
  engagement: {
    page_views_today: number;
    feature_uses_today: number;
    chat_messages_today: number;
  };
}

export async function collectBriefingData(): Promise<DailyBriefingData> {
  const supabase = getServerSupabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Run all queries in parallel
  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    activeSubscriptions,
    proSubs,
    businessSubs,
    newSubsToday,
    canceledToday,
    pastDue,
    genToday,
    genWeek,
    errors24h,
    criticalErrors,
    highErrors,
    unresolvedErrors,
    pageViewsToday,
    featureUsesToday,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("product", "pro"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("product", "business"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "canceled").gte("canceled_at", todayStart),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "past_due"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("event_category", "ai_generation").gte("created_at", todayStart),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("event_category", "ai_generation").gte("created_at", weekAgo),
    supabase.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo).eq("severity", "critical"),
    supabase.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo).eq("severity", "high"),
    supabase.from("error_logs").select("*", { count: "exact", head: true }).eq("resolved", false),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("event_category", "page_view").gte("created_at", todayStart),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("event_category", "feature_use").gte("created_at", todayStart),
  ]);

  // Calculate active users today (distinct user_ids from events)
  const { data: activeUsersData } = await supabase
    .from("events")
    .select("user_id")
    .gte("created_at", todayStart)
    .limit(1000);

  const activeToday = new Set(activeUsersData?.map((e) => e.user_id).filter(Boolean)).size;

  return {
    date: now.toISOString(),
    users: {
      total: totalUsers.count || 0,
      new_today: newUsersToday.count || 0,
      new_week: newUsersWeek.count || 0,
      active_today: activeToday,
    },
    subscriptions: {
      total_active: activeSubscriptions.count || 0,
      pro: proSubs.count || 0,
      business: businessSubs.count || 0,
      free: (totalUsers.count || 0) - (activeSubscriptions.count || 0),
      new_today: newSubsToday.count || 0,
      canceled_today: canceledToday.count || 0,
      past_due: pastDue.count || 0,
    },
    ai_usage: {
      generations_today: genToday.count || 0,
      generations_week: genWeek.count || 0,
      top_types: [],
    },
    errors: {
      total_24h: errors24h.count || 0,
      critical: criticalErrors.count || 0,
      high: highErrors.count || 0,
      unresolved: unresolvedErrors.count || 0,
      top_endpoints: [],
    },
    engagement: {
      page_views_today: pageViewsToday.count || 0,
      feature_uses_today: featureUsesToday.count || 0,
      chat_messages_today: 0,
    },
  };
}

export function formatBriefingEmail(data: DailyBriefingData): string {
  const date = new Date(data.date).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate estimated MRR
  const mrr = data.subscriptions.pro * 97 + data.subscriptions.business * 297;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#080a0f;color:#e8eaf0;padding:40px 30px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#fff;font-size:24px;margin:0;">Atalaia Daily Briefing</h1>
        <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">${date}</p>
      </div>

      <div style="background:#12151e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);">
        <h2 style="color:#00f5a0;font-size:16px;margin:0 0 12px;">Usuários</h2>
        <table style="width:100%;color:#e8eaf0;font-size:14px;">
          <tr><td>Total</td><td style="text-align:right;font-weight:bold;">${data.users.total}</td></tr>
          <tr><td>Novos hoje</td><td style="text-align:right;font-weight:bold;color:#00f5a0;">${data.users.new_today > 0 ? "+" : ""}${data.users.new_today}</td></tr>
          <tr><td>Novos esta semana</td><td style="text-align:right;">${data.users.new_week}</td></tr>
          <tr><td>Ativos hoje</td><td style="text-align:right;">${data.users.active_today}</td></tr>
        </table>
      </div>

      <div style="background:#12151e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);">
        <h2 style="color:#00f5a0;font-size:16px;margin:0 0 12px;">Revenue (MRR estimado: R$ ${mrr.toLocaleString("pt-BR")})</h2>
        <table style="width:100%;color:#e8eaf0;font-size:14px;">
          <tr><td>Assinantes ativos</td><td style="text-align:right;font-weight:bold;">${data.subscriptions.total_active}</td></tr>
          <tr><td style="padding-left:16px;">Pro (R$97)</td><td style="text-align:right;">${data.subscriptions.pro}</td></tr>
          <tr><td style="padding-left:16px;">Business (R$297)</td><td style="text-align:right;">${data.subscriptions.business}</td></tr>
          <tr><td>Novos hoje</td><td style="text-align:right;color:#00f5a0;">${data.subscriptions.new_today > 0 ? "+" : ""}${data.subscriptions.new_today}</td></tr>
          <tr><td>Cancelamentos hoje</td><td style="text-align:right;${data.subscriptions.canceled_today > 0 ? "color:#ef4444;" : ""}">${data.subscriptions.canceled_today}</td></tr>
          <tr><td>Pagamento pendente</td><td style="text-align:right;${data.subscriptions.past_due > 0 ? "color:#f5a623;" : ""}">${data.subscriptions.past_due}</td></tr>
        </table>
      </div>

      <div style="background:#12151e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);">
        <h2 style="color:#00f5a0;font-size:16px;margin:0 0 12px;">IA & Engajamento</h2>
        <table style="width:100%;color:#e8eaf0;font-size:14px;">
          <tr><td>Gerações IA hoje</td><td style="text-align:right;">${data.ai_usage.generations_today}</td></tr>
          <tr><td>Gerações IA semana</td><td style="text-align:right;">${data.ai_usage.generations_week}</td></tr>
          <tr><td>Page views hoje</td><td style="text-align:right;">${data.engagement.page_views_today}</td></tr>
          <tr><td>Features usadas hoje</td><td style="text-align:right;">${data.engagement.feature_uses_today}</td></tr>
        </table>
      </div>

      ${
        data.errors.total_24h > 0
          ? `
      <div style="background:#12151e;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid ${data.errors.critical > 0 ? "#ef4444" : "rgba(255,255,255,0.05)"};">
        <h2 style="color:${data.errors.critical > 0 ? "#ef4444" : "#f5a623"};font-size:16px;margin:0 0 12px;">Erros (últimas 24h)</h2>
        <table style="width:100%;color:#e8eaf0;font-size:14px;">
          <tr><td>Total</td><td style="text-align:right;">${data.errors.total_24h}</td></tr>
          <tr><td>Críticos</td><td style="text-align:right;${data.errors.critical > 0 ? "color:#ef4444;font-weight:bold;" : ""}">${data.errors.critical}</td></tr>
          <tr><td>Altos</td><td style="text-align:right;">${data.errors.high}</td></tr>
          <tr><td>Não resolvidos (total)</td><td style="text-align:right;">${data.errors.unresolved}</td></tr>
        </table>
      </div>
      `
          : ""
      }

      <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;margin-top:8px;">
        <p style="color:#6b7280;font-size:12px;margin:0;">Atalaia Daily Briefing - Gerado automaticamente</p>
      </div>
    </div>
  `;
}
