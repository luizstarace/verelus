import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

type ItemUpdate = { id: string; completed?: boolean; skipped?: boolean };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { checklist_id?: string; item_id?: string; completed?: boolean; skipped?: boolean };
    if (!body.checklist_id || !body.item_id) {
      return NextResponse.json({ error: 'checklist_id e item_id obrigatorios' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    // Fetch current checklist
    const { data: checklist } = await supabase
      .from('checklist_instances')
      .select('items')
      .eq('id', body.checklist_id)
      .eq('user_id', dbUser.id)
      .single();

    if (!checklist) return NextResponse.json({ error: 'Checklist nao encontrada' }, { status: 404 });

    const items = (checklist.items as Array<Record<string, unknown>>).map((it) => {
      if (it.id === body.item_id) {
        const updated = { ...it };
        if (typeof body.completed === 'boolean') {
          updated.completed = body.completed;
          updated.completed_at = body.completed ? new Date().toISOString() : undefined;
        }
        if (typeof body.skipped === 'boolean') {
          updated.skipped = body.skipped;
        }
        return updated;
      }
      return it;
    });

    const { error: upErr } = await supabase
      .from('checklist_instances')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', body.checklist_id);

    if (upErr) {
      console.error('checklist update error:', upErr);
      return NextResponse.json({ error: 'Falha ao atualizar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('checklist update-item error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

void ({} as ItemUpdate);
