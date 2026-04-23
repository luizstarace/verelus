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

// Onboarding email templates in Portuguese
export const ONBOARDING_EMAILS: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Bem-vindo ao Verelus! Suas 11 ferramentas estão prontas',
    body: `
      <h2 style="color: #00f5a0;">Bem-vindo ao Verelus!</h2>
      <p>Estamos felizes em ter você. O Verelus tem 11 ferramentas feitas pra resolver dores reais do músico independente brasileiro.</p>
      <h3>Comece por aqui:</h3>
      <ol>
        <li><strong>Gere sua Bio Adaptativa</strong> — 4 bios prontas pra Spotify, Instagram, EPK e Twitter</li>
        <li><strong>Monte seu Rider Técnico</strong> — PDF profissional com diagrama de palco</li>
        <li><strong>Calcule seu Cachê</strong> — Quanto cobrar por show e quanto sobra no bolso</li>
      </ol>
      <a href="{{appUrl}}/dashboard" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Abrir Ferramentas</a>
    `,
  },
  complete_profile: {
    subject: 'Falta pouco! Complete seu perfil no Verelus',
    body: `
      <h2 style="color: #00f5a0;">Seu perfil está quase pronto!</h2>
      <p>Um perfil completo permite que a IA gere bios, pitches e conteúdo mais personalizado pra você.</p>
      <p>Leva menos de 2 minutos:</p>
      <ul>
        <li>Nome do projeto/banda</li>
        <li>Gênero musical</li>
        <li>URL do Spotify (pra Growth Tracker)</li>
      </ul>
      <a href="{{appUrl}}/dashboard/profile" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Completar Perfil</a>
    `,
  },
  try_ai: {
    subject: 'Gere sua primeira bio com IA em 30 segundos',
    body: `
      <h2 style="color: #00f5a0;">Já experimentou a Bio Adaptativa?</h2>
      <p>Responde 6 perguntas curtas e recebe 4 bios profissionais prontas pra copiar e colar. Cada uma no tamanho exato da plataforma.</p>
      <p>Também temos Rider Técnico, Contrato de Show, Calculadora de Cachê e mais 7 ferramentas.</p>
      <a href="{{appUrl}}/dashboard/bio" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Gerar Minha Bio</a>
    `,
  },
  first_pitch: {
    subject: 'Seu Pitch Kit está pronto — envie pra curadores',
    body: `
      <h2 style="color: #00f5a0;">Suas músicas merecem ser ouvidas!</h2>
      <p>O Pitch Kit do Verelus gera email + 1-pager + press release coordenados pra enviar a curadores, gravadoras e mídia.</p>
      <p>Profissional, personalizado, em português. Tudo em menos de 1 minuto.</p>
      <a href="{{appUrl}}/dashboard/pitch-kit" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Criar Meu Pitch Kit</a>
    `,
  },
};
