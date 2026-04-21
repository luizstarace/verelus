export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

export async function POST() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const instanceName = `attendly_${business.id}`;

    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!createRes.ok) {
      const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY },
      });

      if (!qrRes.ok) {
        return NextResponse.json({ error: 'Erro ao conectar WhatsApp' }, { status: 502 });
      }

      const qrData = await qrRes.json();
      return NextResponse.json({ qrcode: qrData.base64 || qrData.qrcode });
    }

    const data = await createRes.json();
    return NextResponse.json({ qrcode: data.qrcode?.base64 || data.base64 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
