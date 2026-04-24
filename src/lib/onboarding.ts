import { getServerSupabase } from './auth';
import { updateOnboarding, getOnboardingProgress } from './tracking';

// Check and update onboarding steps based on user activity
export async function checkOnboardingMilestones(userId: string) {
  const supabase = getServerSupabase();
  const progress = await getOnboardingProgress(userId);

  if (!progress) {
    // Initialize onboarding for new user
    await supabase.from('onboarding_progress').upsert({
      user_id: userId,
      welcome_email_sent: false,
      profile_completed: false,
      first_generation: false,
      first_export: false,
      first_pitch: false,
      onboarding_completed: false,
    }, { onConflict: 'user_id' });
    return;
  }

  // Check if profile is completed
  if (!progress.profile_completed) {
    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('band_name, genre, bio')
      .eq('user_id', userId)
      .single();

    if (profile?.band_name && profile?.genre && profile?.bio) {
      await updateOnboarding(userId, 'profile_completed', true);
    }
  }

  // Check if first AI generation happened
  if (!progress.first_generation) {
    const { count } = await supabase
      .from('ai_outputs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count || 0) > 0) {
      await updateOnboarding(userId, 'first_generation', true);
    }
  }

  // Check if first pitch was submitted
  if (!progress.first_pitch) {
    const { count } = await supabase
      .from('pitch_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count || 0) > 0) {
      await updateOnboarding(userId, 'first_pitch', true);
    }
  }

  // NOTE: first_export and spotify_connected are tracked separately
  // by their respective feature modules (export and Spotify integration).

  // Core onboarding is complete when profile is filled and first AI generation is done.
  const updated = await getOnboardingProgress(userId);
  if (updated && updated.profile_completed && updated.first_generation && !updated.onboarding_completed) {
    await updateOnboarding(userId, 'onboarding_completed', true);
  }
}

// Determine which onboarding email to send
export function getNextOnboardingEmail(progress: Record<string, boolean | string | null>): string | null {
  if (!progress.welcome_email_sent) return 'welcome';
  if (!progress.profile_completed) return 'complete_profile';
  if (!progress.first_generation) return 'try_ai';
  if (!progress.first_pitch) return 'first_pitch';
  return null;
}

// Onboarding email templates em PT-BR — Attendly (atendente IA pra PMEs).
//
// Nota: checkOnboardingMilestones acima ainda verifica tabelas legadas
// (artist_profiles, ai_outputs, pitch_submissions) do produto musical
// descontinuado. Os endpoints /api/onboarding/* também não têm caller
// ativo no momento. Estes templates são um default seguro caso o fluxo
// seja reativado — eventual migração pra Attendly milestones
// (business criado, WhatsApp conectado, 1ª conversa) fica pra depois.
export const ONBOARDING_EMAILS: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Bem-vindo ao Attendly! Vamos colocar seu atendente no ar',
    body: `
      <h2 style="color: #00f5a0;">Seu teste grátis de 7 dias começou!</h2>
      <p>O Attendly é um atendente de IA que responde seus clientes 24h por dia, no WhatsApp e no widget do seu site. Em 15 minutos fica pronto.</p>
      <h3>Comece por aqui:</h3>
      <ol>
        <li><strong>Configure seu negócio</strong> — nome, serviços, horários e FAQ (5 minutos)</li>
        <li><strong>Teste o atendente</strong> — simule uma conversa no próprio painel antes de ir ao ar</li>
        <li><strong>Conecte o WhatsApp</strong> — escaneie um QR com um número dedicado</li>
      </ol>
      <a href="{{appUrl}}/dashboard/attendly/setup" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Começar configuração</a>
    `,
  },
  complete_profile: {
    subject: 'Falta pouco! Complete a configuração do seu atendente',
    body: `
      <h2 style="color: #00f5a0;">Seu atendente precisa conhecer seu negócio.</h2>
      <p>Sem os dados básicos preenchidos, a IA responde de forma genérica. Leva menos de 5 minutos pra configurar:</p>
      <ul>
        <li>Nome e categoria do negócio</li>
        <li>Serviços e preços</li>
        <li>Horário de funcionamento</li>
        <li>Perguntas frequentes dos clientes</li>
      </ul>
      <a href="{{appUrl}}/dashboard/attendly/setup" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Completar configuração</a>
    `,
  },
  try_ai: {
    subject: 'Teste seu atendente antes de colocar no ar',
    body: `
      <h2 style="color: #00f5a0;">Já simulou uma conversa com o seu atendente?</h2>
      <p>No painel, você pode mandar mensagens como se fosse um cliente e ver como a IA responde. É a melhor forma de ajustar tom, FAQ e regras de transferência antes de abrir pro público.</p>
      <p>O modo de teste não conta no seu limite mensal.</p>
      <a href="{{appUrl}}/dashboard/attendly/setup" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Testar agora</a>
    `,
  },
  first_pitch: {
    subject: 'Conecte o WhatsApp e comece a atender',
    body: `
      <h2 style="color: #00f5a0;">Último passo: conectar o WhatsApp.</h2>
      <p>A integração é feita escaneando um QR Code com o celular — igual o WhatsApp Web. Dica importante: use um número dedicado (não o pessoal) pra evitar que a IA responda seus familiares.</p>
      <p>Se preferir começar só pelo widget do site, tudo bem — dá pra conectar o WhatsApp depois.</p>
      <a href="{{appUrl}}/dashboard/attendly/settings?tab=whatsapp" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Conectar WhatsApp</a>
    `,
  },
};
