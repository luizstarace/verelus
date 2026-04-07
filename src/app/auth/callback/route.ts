import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      // Check if user exists in our users table, create if not
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const serviceSupabase = createClient(
          process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: existingUser } = await serviceSupabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          await serviceSupabase.from('users').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            plan: 'free',
          });
        }
      }

      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
  }

  // If code-based auth (OAuth)
  if (code) {
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  // Error - redirect to login
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
}
