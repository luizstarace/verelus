export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildMessageHistory, toClaudeMessages, checkBusinessAvailability } from '@/lib/atalaia/chat';
import { detectTransfer } from '@/lib/atalaia/transfer';
import { incrementUsage, checkUsageLimit } from '@/lib/atalaia/usage';
import { getPlanFromSubscription } from '@/lib/atalaia/plans';
import { corsHeaders, corsResponse } from '@/lib/atalaia/cors';
import { rateLimit, getRateLimitHeaders } from '@/lib/atalaia/rate-limit';
import { requireUser } from '@/lib/api-auth';
import { logAtalaia } from '@/lib/atalaia/logger';
import Anthropic from '@anthropic-ai/sdk';

export async function OPTIONS() { return corsResponse(); }

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
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(clientIp, 30, 60000); // 30 requests per minute per IP
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' },
      { status: 429, headers: { ...corsHeaders(), ...getRateLimitHeaders(rl.remaining, 30) } }
    );
  }

  const startTime = Date.now();
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const { business_id, conversation_id, message, channel, customer_name, customer_phone, preview } = body;

    if (!business_id || !message || !channel) {
      return NextResponse.json({ error: 'business_id, message, and channel are required' }, { status: 400, headers: corsHeaders() });
    }

    // Load business
    const { data: business, error: bizErr } = await supabase
      .from('atalaia_businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404, headers: corsHeaders() });
    }

    // Per-business rate-limit (defense against distributed enumeration/flood
    // on a specific victim's business_id, which the IP limit alone does not
    // catch). Skipped in preview since owner already auth'd.
    if (!preview) {
      const bizRl = rateLimit(`biz:${business_id}`, 500, 60000);
      if (!bizRl.allowed) {
        return NextResponse.json(
          { error: 'Muitas mensagens recentes. Tente novamente em 1 minuto.' },
          { status: 429, headers: { ...corsHeaders(), ...getRateLimitHeaders(bizRl.remaining, 500) } }
        );
      }
    }

    // Preview mode (wizard/settings test chat) must require the caller to own
    // this business. Without this check any client could send {preview:true}
    // and bypass trial + usage gates, racking up LLM cost.
    if (preview) {
      try {
        const { userId } = await requireUser();
        if (business.user_id !== userId) {
          return NextResponse.json(
            { error: 'Preview requer autenticação como dono do negócio.' },
            { status: 403, headers: corsHeaders() }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Preview requer autenticação.' },
          { status: 401, headers: corsHeaders() }
        );
      }
    }

    const availability = checkBusinessAvailability(business, Boolean(preview));
    if (!availability.allowed) {
      const payload = availability.paused
        ? { response: availability.response, paused: true }
        : { error: availability.error };
      return NextResponse.json(payload, { status: availability.status, headers: corsHeaders() });
    }

    // Hard gate: enforce usage limits + trial expiry BEFORE calling Claude, so an
    // abuser cannot rack up LLM cost by spamming after limit is exhausted. Preview
    // mode skips (it's the owner testing in the wizard, already rate-limited by IP).
    if (!preview) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('product')
        .eq('user_id', business.user_id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .single();

      // Trial enforcement: if no paid subscription AND trial has expired, block.
      if (!sub) {
        if (business.trial_ends_at && new Date(business.trial_ends_at) < new Date()) {
          return NextResponse.json({
            error: 'Seu período de trial expirou. Faça upgrade pra continuar.',
            trial_expired: true,
          }, { status: 402, headers: corsHeaders() });
        }
      }

      const plan = getPlanFromSubscription(sub?.product || null);
      const usage = await checkUsageLimit(supabase, business_id, plan);
      if (!usage.withinLimit) {
        return NextResponse.json({
          error: 'Limite de mensagens do plano excedido. Faça upgrade pra continuar.',
          usage_exceeded: true,
        }, { status: 402, headers: corsHeaders() });
      }
    }

    // Get or create conversation (skip for preview)
    let convId = conversation_id;
    if (!preview) {
      if (convId) {
        const { data: conv } = await supabase
          .from('atalaia_conversations')
          .select('id, status')
          .eq('id', convId)
          .eq('business_id', business_id)
          .single();

        if (conv?.status === 'human_needed') {
          return NextResponse.json({
            response: `Seu atendimento está sendo feito por ${business.name}. Aguarde a resposta.`,
            human_needed: true,
          }, { headers: corsHeaders() });
        }
        if (!conv) convId = null;
      }

      if (!convId) {
        if (channel === 'whatsapp' && customer_phone) {
          const { data: existingConv } = await supabase
            .from('atalaia_conversations')
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
            .from('atalaia_conversations')
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
      await supabase.from('atalaia_messages').insert({
        conversation_id: convId,
        role: 'customer',
        content: message,
      });
    }

    // Load message history
    let history: { role: 'customer' | 'assistant' | 'human'; content: string }[] = [];
    if (convId && !preview) {
      const { data: messages } = await supabase
        .from('atalaia_messages')
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

    // Resolve system prompt (log if fallback used)
    let systemPrompt = business.ai_context;
    if (!systemPrompt) {
      systemPrompt = `Você é o atendente virtual de "${business.name}". Responda de forma educada e objetiva.`;
      supabase.from('atalaia_logs').insert({
        business_id,
        endpoint: '/api/atalaia/chat',
        channel,
        error: 'ai_context is null — using fallback prompt',
        status_code: 0,
      }).then(() => {});
    }

    // Call Claude Haiku with streaming
    const stream = getAnthropic().messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
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
            await supabase.from('atalaia_messages').insert({
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
                .from('atalaia_conversations')
                .update({ status: 'human_needed' })
                .eq('id', convId);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ transfer: true, reason: transfer.reason })}\n\n`));
            }

            // Send transfer notification email (fire and forget)
            if (transfer.shouldTransfer) {
              const { notifyOwnerEmail, buildTransferEmail } = await import('@/lib/atalaia/notifications');
              const { data: ownerUser } = await supabase
                .from('users')
                .select('email')
                .eq('id', business.user_id)
                .single();

              if (ownerUser?.email) {
                const emailData = buildTransferEmail(
                  business.name,
                  customer_name || 'Visitante',
                  `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/atalaia/inbox?id=${convId}`
                );
                emailData.to = ownerUser.email;
                notifyOwnerEmail(emailData).catch(() => {});
              }
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
            if (usage.percentage >= 80) usageInfo = { usage_warning: true, usage_percentage: Math.min(usage.percentage, 100) };
            if (!usage.withinLimit) usageInfo = { ...usageInfo, overage: true };
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId, ...usageInfo })}\n\n`));

          // Log before closing
          const latency = Date.now() - startTime;
          await supabase.from('atalaia_logs').insert({
            business_id,
            endpoint: '/api/atalaia/chat',
            channel,
            tokens_used: totalTokens,
            latency_ms: latency,
            status_code: 200,
          });

          controller.close();
        } catch (err) {
          // Log error before closing
          const latency = Date.now() - startTime;
          supabase.from('atalaia_logs').insert({
            business_id,
            endpoint: '/api/atalaia/chat',
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
        ...corsHeaders(),
      },
    });
  } catch (err) {
    await logAtalaia(supabase, {
      endpoint: '/api/atalaia/chat',
      status_code: 500,
      latency_ms: Date.now() - startTime,
      error: err,
    });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500, headers: corsHeaders() });
  }
}
