import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import type { GrowthSource } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * User atualiza manualmente seguidores de Instagram ou TikTok (nao ha API OAuth-free).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { source?: string; value?: number };
    if (!body.source || !['instagram', 'tiktok'].includes(body.source)) {
      return NextResponse.json({ error: 'source deve ser instagram ou tiktok' }, { status: 400 });
    }
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
      return NextResponse.json({ error: 'Valor inválido (deve ser entre 0 e 1 bilhão)' }, { status: 400 });
    }

    const { userId, supabase } = await requireUser();

    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from('growth_snapshots')
      .upsert(
        {
          user_id: userId,
          source: body.source as GrowthSource,
          metric_value: Math.round(value),
          snapshot_date: today,
        },
        { onConflict: 'user_id,source,snapshot_date' }
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('manual-update error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
