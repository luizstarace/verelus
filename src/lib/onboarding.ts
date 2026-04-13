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
    subject: 'Bem-vindo ao Verelus! Vamos comecar sua jornada musical',
    body: `
      <h2 style="color: #00f5a0;">Bem-vindo ao Verelus!</h2>
      <p>Estamos muito felizes em ter voce conosco. O Verelus foi criado para ajudar artistas independentes como voce a profissionalizar sua carreira musical.</p>
      <h3>Seus primeiros passos:</h3>
      <ol>
        <li><strong>Complete seu perfil</strong> — Adicione o nome do seu projeto, genero e bio</li>
        <li><strong>Gere seu primeiro conteudo com IA</strong> — Experimente criar um press release ou post social</li>
        <li><strong>Explore os modulos</strong> — Setlists, financeiro, contratos e muito mais</li>
      </ol>
      <a href="{{appUrl}}/dashboard/profile" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Completar meu Perfil</a>
    `,
  },
  complete_profile: {
    subject: 'Falta pouco! Complete seu perfil no Verelus',
    body: `
      <h2 style="color: #00f5a0;">Seu perfil esta quase pronto!</h2>
      <p>Notamos que voce ainda nao completou seu perfil de artista. Um perfil completo permite que a IA gere conteudo mais personalizado para voce.</p>
      <p>Leva menos de 2 minutos:</p>
      <ul>
        <li>Nome do projeto/banda</li>
        <li>Genero musical</li>
        <li>Uma bio curta</li>
      </ul>
      <a href="{{appUrl}}/dashboard/profile" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Completar Perfil</a>
    `,
  },
  try_ai: {
    subject: 'Experimente a IA do Verelus — seu primeiro conteudo em segundos',
    body: `
      <h2 style="color: #00f5a0;">Ja experimentou a IA do Verelus?</h2>
      <p>Voce pode gerar press releases, posts para redes sociais, setlists e muito mais com apenas um clique.</p>
      <p>Nossos artistas mais ativos geram em media 15 conteudos por mes. Que tal comecar agora?</p>
      <a href="{{appUrl}}/dashboard/press" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Gerar Meu Primeiro Conteudo</a>
    `,
  },
  first_pitch: {
    subject: 'Envie seu primeiro pitch para playlists no Verelus',
    body: `
      <h2 style="color: #00f5a0;">Suas musicas merecem ser ouvidas!</h2>
      <p>O modulo de Pitching do Verelus te ajuda a encontrar as playlists certas para suas musicas e gerar textos de pitch profissionais.</p>
      <p>Artistas que fazem pitch regularmente tem 3x mais chances de serem adicionados a playlists.</p>
      <a href="{{appUrl}}/dashboard/pitching" style="display:inline-block;background:#00f5a0;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Fazer Meu Primeiro Pitch</a>
    `,
  },
};
