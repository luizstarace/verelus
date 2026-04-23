import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  supabase: SupabaseClient;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new ApiError('Não autenticado', 401);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email!.toLowerCase().trim())
    .single();
  if (!dbUser) throw new ApiError('Usuário não encontrado', 404);

  return { userId: dbUser.id, email: user.email!, supabase };
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return { error: err.message, status: err.status };
  }
  const msg = err instanceof Error ? err.message : 'Erro interno';
  return { error: msg, status: 500 };
}
