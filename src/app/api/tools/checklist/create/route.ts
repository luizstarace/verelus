import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { buildChecklist } from '@/lib/checklist-template';
import type { ChecklistInput, ReleaseType, ChecklistObjective, ChecklistBudget } from '@/lib/types/tools';

export const runtime = 'edge';

function validateInput(raw: unknown): ChecklistInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;

  if (!['single', 'ep', 'album'].includes(r.release_type as string)) return { error: 'release_type invalido' };
  if (typeof r.release_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.release_date)) return { error: 'release_date invalido (YYYY-MM-DD)' };
  if (typeof r.release_title !== 'string' || !r.release_title.trim()) return { error: 'release_title obrigatorio' };
  if (!['discovery', 'monetization', 'radio'].includes(r.objective as string)) return { error: 'objective invalido' };
  if (!['caseiro', 'medio', 'pro'].includes(r.budget as string)) return { error: 'budget invalido' };
  if (!Array.isArray(r.platforms)) return { error: 'platforms deve ser array' };

  const validPlatforms = ['spotify', 'apple', 'youtube_music', 'deezer', 'tidal', 'soundcloud', 'bandcamp'];
  const platforms = (r.platforms as unknown[]).filter((p) => typeof p === 'string' && validPlatforms.includes(p));

  return {
    release_type: r.release_type as ReleaseType,
    release_date: r.release_date,
    release_title: String(r.release_title).trim(),
    objective: r.objective as ChecklistObjective,
    budget: r.budget as ChecklistBudget,
    platforms: platforms as ChecklistInput['platforms'],
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const input = validateInput(raw);
    if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

    const { userId, supabase } = await requireUser();

    const items = buildChecklist(input).map((item) => ({
      ...item,
      completed: false,
    }));

    const { data: instance, error: insErr } = await supabase
      .from('checklist_instances')
      .insert({ user_id: userId, input, items })
      .select()
      .single();

    if (insErr) {
      console.error('checklist insert error:', insErr);
      return NextResponse.json({ error: 'Falha ao criar checklist' }, { status: 500 });
    }

    return NextResponse.json({ checklist: instance });
  } catch (err) {
    console.error('checklist create error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
