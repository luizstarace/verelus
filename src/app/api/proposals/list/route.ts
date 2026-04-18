import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import type { ProposalWithAnalytics, DashboardSummary } from '@/lib/types/proposals';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: proposals, error: pErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;
    if (!proposals || proposals.length === 0) {
      const summary: DashboardSummary = {
        total_proposals: 0,
        open_proposals: 0,
        pipeline_cents: 0,
        acceptance_rate: 0,
      };
      return NextResponse.json({ proposals: [], summary });
    }

    const ids = proposals.map((p: { id: string }) => p.id);

    // fetch views aggregated
    const { data: views } = await supabase
      .from('proposal_views')
      .select('proposal_id, viewed_at, duration_seconds')
      .in('proposal_id', ids);

    // fetch accepts
    const { data: accepts } = await supabase
      .from('proposal_accepts')
      .select('proposal_id, accepted_at, acceptor_name')
      .in('proposal_id', ids);

    // group views by proposal_id
    const viewMap = new Map<string, { count: number; totalDuration: number; lastViewed: string | null }>();
    for (const v of views ?? []) {
      const cur = viewMap.get(v.proposal_id) ?? { count: 0, totalDuration: 0, lastViewed: null };
      cur.count += 1;
      cur.totalDuration += v.duration_seconds ?? 0;
      if (!cur.lastViewed || v.viewed_at > cur.lastViewed) cur.lastViewed = v.viewed_at;
      viewMap.set(v.proposal_id, cur);
    }

    // group accepts by proposal_id
    const acceptMap = new Map<string, { accepted_at: string; acceptor_name: string }>();
    for (const a of accepts ?? []) {
      acceptMap.set(a.proposal_id, { accepted_at: a.accepted_at, acceptor_name: a.acceptor_name });
    }

    let acceptedCount = 0;
    let pipelineCents = 0;
    let openCount = 0;

    const enriched: ProposalWithAnalytics[] = proposals.map((p: Record<string, unknown>) => {
      const v = viewMap.get(p.id as string);
      const a = acceptMap.get(p.id as string);
      if (a) acceptedCount += 1;
      if (p.status === 'draft' || p.status === 'sent' || p.status === 'viewed') {
        openCount += 1;
        pipelineCents += (p.price_cents as number) ?? 0;
      }
      return {
        ...p,
        view_count: v?.count ?? 0,
        total_duration_seconds: v?.totalDuration ?? 0,
        last_viewed_at: v?.lastViewed ?? null,
        accepted_at: a?.accepted_at ?? null,
        acceptor_name: a?.acceptor_name ?? null,
      } as ProposalWithAnalytics;
    });

    const summary: DashboardSummary = {
      total_proposals: proposals.length,
      open_proposals: openCount,
      pipeline_cents: pipelineCents,
      acceptance_rate: proposals.length > 0 ? Math.round((acceptedCount / proposals.length) * 100) : 0,
    };

    return NextResponse.json({ proposals: enriched, summary });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
