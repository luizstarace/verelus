export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { instance, data: msgData } = body;

    const businessId = instance?.replace('attendly_', '');
    if (!businessId || !msgData?.message?.conversation) {
      return NextResponse.json({ ok: true });
    }

    const customerPhone = msgData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const messageText = msgData.message?.conversation ||
      msgData.message?.extendedTextMessage?.text || '';

    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attendly/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        message: messageText,
        channel: 'whatsapp',
        customer_phone: customerPhone,
      }),
    });

    if (chatRes.ok && chatRes.body) {
      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) fullText += parsed.text;
            } catch {}
          }
        }
      }

      return NextResponse.json({ response: fullText });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
