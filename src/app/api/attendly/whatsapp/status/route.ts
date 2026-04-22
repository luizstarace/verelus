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
      .select('id, whatsapp_number')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ connected: false, error: 'Negócio não encontrado' });
    }

    if (!EVOLUTION_API_KEY) {
      return NextResponse.json({ connected: false, state: 'not_configured' });
    }

    const instanceName = `attendly_${business.id}`;
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ connected: false, state: 'unknown' });
    }

    const data = await res.json();
    const state = data.instance?.state || 'unknown';
    const connected = state === 'open';

    // If just connected, try to fetch the owner phone number and persist it
    if (connected && !business.whatsapp_number) {
      try {
        const infoRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
          headers: { 'apikey': EVOLUTION_API_KEY },
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          const item = Array.isArray(info) ? info[0] : info;
          const phone = item?.instance?.owner?.split('@')[0] || item?.owner?.split('@')[0] || null;
          if (phone) {
            await supabase
              .from('attendly_businesses')
              .update({ whatsapp_number: phone })
              .eq('id', business.id);
          }
        }
      } catch {}
    }

    return NextResponse.json({ connected, state });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
