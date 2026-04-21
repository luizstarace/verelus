export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ connected: false, error: 'Negócio não encontrado' });
    }

    const instanceName = `attendly_${business.id}`;
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ connected: false });
    }

    const data = await res.json();
    const connected = data.instance?.state === 'open';

    return NextResponse.json({ connected, state: data.instance?.state || 'unknown' });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
