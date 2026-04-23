export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

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

    if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
      return NextResponse.json(
        { error: 'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
        { status: 503 }
      );
    }

    const instanceName = `attendly_${business.id}`;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/attendly/whatsapp/webhook`;

    // Evolution does not auto-attach auth to outbound webhooks.
    // The apikey header must be declared here so our webhook route can validate
    // incoming POSTs.
    const webhookConfig = {
      enabled: true,
      url: webhookUrl,
      headers: { apikey: EVOLUTION_API_KEY },
      byEvents: false,
      base64: false,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    };

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
        webhook: webhookConfig,
      }),
    });

    // Always re-sync webhook config so instances created before the headers fix
    // get healed on the next connect.
    await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookConfig),
    }).catch(() => {});

    if (createRes.ok) {
      const data = await createRes.json();
      return NextResponse.json({
        instance: instanceName,
        qrcode: data.qrcode?.base64 || data.base64 || null,
      });
    }

    // Instance already exists — fetch QR or reconnect
    const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    if (!qrRes.ok) {
      const text = await qrRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'Erro ao conectar WhatsApp', detail: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const qrData = await qrRes.json();
    return NextResponse.json({
      instance: instanceName,
      qrcode: qrData.base64 || qrData.qrcode || null,
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 });
    }

    const instanceName = `attendly_${business.id}`;
    await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': EVOLUTION_API_KEY },
    });
    await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    await supabase
      .from('attendly_businesses')
      .update({ whatsapp_number: null })
      .eq('id', business.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
