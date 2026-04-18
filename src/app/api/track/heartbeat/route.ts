import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const body = await req.json();
    const { view_id, duration_seconds } = body;

    if (!view_id || typeof duration_seconds !== 'number') {
      return NextResponse.json({ ok: true });
    }

    const capped = Math.min(Math.max(0, Math.floor(duration_seconds)), 3600);

    await supabase
      .from('proposal_views')
      .update({ duration_seconds: capped })
      .eq('id', view_id);

    return NextResponse.json({ ok: true });
  } catch {
    // never fail visibly
    return NextResponse.json({ ok: true });
  }
}
