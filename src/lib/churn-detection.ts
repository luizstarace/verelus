import { getServerSupabase } from './auth';

export interface ChurnRiskUser {
  user_id: string;
  email: string;
  tier: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number; // 0-100
  risk_factors: string[];
  last_active: string | null;
  days_inactive: number;
  subscription_status: string;
}

export async function analyzeChurnRisk(): Promise<ChurnRiskUser[]> {
  const supabase = getServerSupabase();

  // Get all paying users with their subscription info
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, product, status, stripe_customer_id, current_period_end')
    .in('status', ['active', 'past_due', 'trialing']);

  if (!subscriptions || subscriptions.length === 0) return [];

  const riskUsers: ChurnRiskUser[] = [];

  for (const sub of subscriptions) {
    const factors: string[] = [];
    let score = 0;

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', sub.user_id)
      .single();

    if (!user) continue;

    // Check last activity from onboarding_progress
    const { data: onboarding } = await supabase
      .from('onboarding_progress')
      .select('last_active_at')
      .eq('user_id', sub.user_id)
      .single();

    const lastActive = onboarding?.last_active_at;
    const daysInactive = lastActive
      ? Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Factor 1: Inactivity
    if (daysInactive > 30) { score += 40; factors.push(`Inativo ha ${daysInactive} dias`); }
    else if (daysInactive > 14) { score += 25; factors.push(`Inativo ha ${daysInactive} dias`); }
    else if (daysInactive > 7) { score += 15; factors.push(`Inativo ha ${daysInactive} dias`); }

    // Factor 2: Payment issues
    if (sub.status === 'past_due') { score += 30; factors.push('Pagamento pendente'); }

    // Factor 3: Subscription ending soon
    if (sub.current_period_end) {
      const daysUntilEnd = Math.floor((new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd <= 3) { score += 15; factors.push(`Assinatura expira em ${daysUntilEnd} dias`); }
    }

    // Factor 4: Low feature usage (count events in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sub.user_id)
      .gte('created_at', thirtyDaysAgo);

    if ((eventCount || 0) < 5) { score += 20; factors.push(`Apenas ${eventCount || 0} acoes nos ultimos 30 dias`); }
    else if ((eventCount || 0) < 15) { score += 10; factors.push(`Apenas ${eventCount || 0} acoes nos ultimos 30 dias`); }

    // Determine risk level
    let risk_level: ChurnRiskUser['risk_level'] = 'low';
    if (score >= 70) risk_level = 'critical';
    else if (score >= 50) risk_level = 'high';
    else if (score >= 25) risk_level = 'medium';

    // Only include users with some risk
    if (score > 10) {
      riskUsers.push({
        user_id: sub.user_id,
        email: user.email,
        tier: sub.product,
        risk_level,
        risk_score: Math.min(score, 100),
        risk_factors: factors,
        last_active: lastActive,
        days_inactive: daysInactive,
        subscription_status: sub.status,
      });
    }
  }

  // Sort by risk score descending
  return riskUsers.sort((a, b) => b.risk_score - a.risk_score);
}

// Re-engagement email templates
export const REENGAGEMENT_EMAILS: Record<string, { subject: string; body: string }> = {
  inactive_7d: {
    subject: 'Sentimos sua falta no Verelus!',
    body: `
      <h2 style="color: #00f5a0;">Faz uma semana que voce nao aparece!</h2>
      <p>Sua carreira musical nao para, e o Verelus esta aqui para ajudar.</p>
      <p>Que tal gerar um novo conteudo hoje?</p>
      <ul>
        <li>Crie um post para suas redes sociais</li>
        <li>Gere um press release para seu proximo lancamento</li>
        <li>Planeje sua proxima setlist</li>
      </ul>
      <a href="{{appUrl}}/dashboard" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Voltar ao Dashboard</a>
    `,
  },
  inactive_14d: {
    subject: 'Sua carreira musical esta esperando por voce',
    body: `
      <h2 style="color: #00f5a0;">Ja se passaram 2 semanas...</h2>
      <p>Sabemos que a vida de artista e corrida, mas 5 minutos no Verelus podem fazer a diferenca.</p>
      <p>Nossos artistas mais ativos geram em media 3x mais oportunidades de playlist.</p>
      <a href="{{appUrl}}/dashboard" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Retomar Minha Jornada</a>
    `,
  },
  past_due: {
    subject: 'Acao necessaria: problema com seu pagamento no Verelus',
    body: `
      <h2 style="color: #f5a623;">Detectamos um problema com seu pagamento</h2>
      <p>Sua assinatura do Verelus esta com pagamento pendente. Para evitar a interrupcao dos seus servicos, por favor atualize seus dados de pagamento.</p>
      <p>Se precisar de ajuda, estamos aqui: suporte@verelus.com</p>
      <a href="{{appUrl}}/dashboard" style="display:inline-block;background:#f5a623;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Atualizar Pagamento</a>
    `,
  },
};
