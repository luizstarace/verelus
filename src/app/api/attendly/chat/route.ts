export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildMessageHistory, toClaudeMessages } from '@/lib/attendly/chat';
import { detectTransfer } from '@/lib/attendly/transfer';
import { incrementUsage, checkUsageLimit } from '@/lib/attendly/usage';
import { getPlanFromSubscription } from '@/lib/attendly/plans';
import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const { business_id, conversation_id, message, channel, customer_name, customer_phone, preview } = body;

    if (!business_id || !message || !channel) {
      return NextResponse.json({ error: 'business_id, message, and channel are required' }, { status: 400 });
    }

    // Load business
    const { data: business, error: bizErr } = await supabase
      .from('attendly_businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Check status
    if (business.status === 'paused') {
      return NextResponse.json({
        response: `Este atendente está temporariamente indisponível. Entre em contato diretamente: ${business.phone || 'sem telefone cadastrado'}`,
        paused: true,
      });
    }
    if (business.status === 'setup' && !preview) {
      return NextResponse.json({ error: 'Atendente ainda não foi ativado' }, { status: 403 });
    }

    // Get or create conversation (skip for preview)
    let convId = conversation_id;
    if (!preview) {
      if (convId) {
        const { data: conv } = await supabase
          .from('attendly_conversations')
          .select('id, status')
          .eq('id', convId)
          .eq('business_id', business_id)
          .single();

        if (conv?.status === 'human_needed') {
          return NextResponse.json({
            response: `Seu atendimento está sendo feito por ${business.name}. Aguarde a resposta.`,
            human_needed: true,
          });
        }
        if (!conv) convId = null;
      }

      if (!convId) {
        if (channel === 'whatsapp' && customer_phone) {
          const { data: existingConv } = await supabase
            .from('attendly_conversations')
            .select('id, status')
            .eq('business_id', business_id)
            .eq('customer_phone', customer_phone)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            convId = existingConv.id;
          }
        }

        if (!convId) {
          const { data: newConv, error: convErr } = await supabase
            .from('attendly_conversations')
            .insert({
              business_id,
              channel,
              customer_name: customer_name || null,
              customer_phone: customer_phone || null,
            })
            .select('id')
            .single();

          if (convErr) throw convErr;
          convId = newConv.id;
        }
      }

      // Save customer message
      await supabase.from('attendly_messages').insert({
        conversation_id: convId,
        role: 'customer',
        content: message,
      });
    }

    // Load message history
    let history: { role: 'customer' | 'assistant' | 'human'; content: string }[] = [];
    if (convId && !preview) {
      const { data: messages } = await supabase
        .from('attendly_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messages) {
        history = messages;
      }
    }

    const contextMessages = buildMessageHistory(history);
    const claudeMessages = toClaudeMessages(contextMessages);

    if (claudeMessages.length === 0 || preview) {
      claudeMessages.push({ role: 'user', content: message });
    }

    // Call Claude Haiku with streaming
    const stream = getAnthropic().messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: business.ai_context || `Você é o atendente virtual de "${business.name}". Responda de forma educada e objetiva.`,
      messages: claudeMessages,
    });

    let fullResponse = '';
    let totalTokens = 0;

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }

          const finalMessage = await stream.finalMessage();
          totalTokens = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

          let usageInfo = {};
          if (convId && !preview) {
            await supabase.from('attendly_messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: fullResponse,
              tokens_used: totalTokens,
            });

            await supabase.rpc('increment_message_count', { conv_id: convId });
            await incrementUsage(supabase, business_id, totalTokens);

            const transfer = detectTransfer({ aiResponse: fullResponse, customerMessage: message });
            if (transfer.shouldTransfer) {
              await supabase
                .from('attendly_conversations')
                .update({ status: 'human_needed' })
                .eq('id', convId);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ transfer: true, reason: transfer.reason })}\n\n`));
            }

            // Check usage
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('product')
              .eq('user_id', business.user_id)
              .in('status', ['active', 'trialing'])
              .limit(1)
              .single();
            const plan = getPlanFromSubscription(sub?.product || null);
            const usage = await checkUsageLimit(supabase, business_id, plan);
            if (usage.percentage >= 80) usageInfo = { usage_warning: true, usage_percentage: usage.percentage };
            if (!usage.withinLimit) usageInfo = { ...usageInfo, overage: true };
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId, ...usageInfo })}\n\n`));

          // Log before closing
          const latency = Date.now() - startTime;
          await supabase.from('attendly_logs').insert({
            business_id,
            endpoint: '/api/attendly/chat',
            channel,
            tokens_used: totalTokens,
            latency_ms: latency,
            status_code: 200,
          });

          controller.close();
        } catch (err) {
          // Log error before closing
          const latency = Date.now() - startTime;
          supabase.from('attendly_logs').insert({
            business_id,
            endpoint: '/api/attendly/chat',
            channel,
            tokens_used: totalTokens,
            latency_ms: latency,
            status_code: 500,
            error: err instanceof Error ? err.message : 'Stream error',
          }).then(() => {});

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro ao processar resposta' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
