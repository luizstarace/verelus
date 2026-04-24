import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Simple in-memory rate limiter (edge-compatible)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 100) {
    Array.from(rateLimitMap.entries()).forEach(([k, v]) => {
      if (now > v.resetAt) rateLimitMap.delete(k);
    });
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Basic email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Generate a unique unsubscribe token. Must be UUID because the
// email_subscribers.unsubscribe_token column is typed uuid in Postgres —
// 48-char hex used previously caused every new INSERT to fail with 400.
function generateToken(): string {
  return crypto.randomUUID();
}

async function sendWelcomeEmail(name: string, email: string, unsubscribeToken: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://verelus.com";
    const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Verelus Newsletter <contato@verelus.com>",
        to: [email],
        subject: "Bem-vindo à Verelus!",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 30px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5f5f5; font-size: 28px; margin: 0;">Verelus</h1>
              <p style="color: #a3a3a3; font-size: 14px; margin: 4px 0 0;">Produtos com IA para o seu negócio</p>
            </div>

            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px; border: 1px solid #262626;">
              <h2 style="color: #f5f5f5; margin: 0 0 16px; font-size: 22px;">Olá, ${name.replace(/[<>&"']/g, '')}!</h2>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px;">
                Obrigado por se cadastrar. Você vai receber novidades da Verelus, lançamentos dos nossos produtos com IA (o primeiro é o <strong style="color: #60a5fa;">Attendly</strong> — atendente virtual 24h via WhatsApp e widget), e dicas práticas para automatizar atendimento no seu negócio.
              </p>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0;">
                Sem spam. Frequência baixa, só quando tem algo útil de verdade.
              </p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Novos produtos e funcionalidades</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Você é avisado primeiro quando algo novo sai no ar</p>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Casos reais de uso</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Como outras PMEs usam IA para atender melhor e vender mais</p>
              </div>
              <div>
                <strong style="color: #f5f5f5;">Guias práticos</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Passo-a-passo curto pra tirar o máximo das nossas ferramentas</p>
              </div>
            </div>

            <div style="background: #171717; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #262626;">
              <p style="color: #d4d4d4; margin: 0 0 12px; font-size: 15px;">
                Conheça o Attendly — nosso atendente virtual de IA pra PMEs brasileiras.
              </p>
              <a href="${appUrl}/attendly" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Ver o Attendly
              </a>
            </div>

            <div style="text-align: center; border-top: 1px solid #262626; padding-top: 20px;">
              <p style="color: #737373; font-size: 13px; margin: 0;">
                <strong style="color: #a3a3a3;">Verelus</strong> — Produtos com IA para o seu negócio
              </p>
              <p style="color: #525252; font-size: 12px; margin: 8px 0 0;">
                &copy; 2026 Verelus. Todos os direitos reservados.
              </p>
              <p style="color: #525252; font-size: 11px; margin: 12px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #525252; text-decoration: underline;">Cancelar inscrição</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend error:", errorData);
    }
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { name, email } = body;

    if (!email || !name || typeof email !== 'string' || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (trimmedName.length < 1 || trimmedName.length > 200) {
      return NextResponse.json(
        { error: "Name must be between 1 and 200 characters" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("email_subscribers")
      .select("id, status, unsubscribe_token")
      .eq("email", trimmedEmail)
      .single();

    if (existing) {
      if (existing.status === "unsubscribed") {
        const token = existing.unsubscribe_token || generateToken();
        // Re-subscribe
        await supabase
          .from("email_subscribers")
          .update({
            status: "active",
            full_name: trimmedName,
            unsubscribe_token: token,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        await sendWelcomeEmail(trimmedName, trimmedEmail, token);
        return NextResponse.json({ success: true, resubscribed: true });
      }
      // Already active
      return NextResponse.json({ success: true, already: true });
    }

    // New subscriber
    const unsubscribeToken = generateToken();
    const { error } = await supabase.from("email_subscribers").insert({
      email: trimmedEmail,
      full_name: trimmedName,
      status: "active",
      source: "landing_page",
      unsubscribe_token: unsubscribeToken,
    });

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    await sendWelcomeEmail(trimmedName, trimmedEmail, unsubscribeToken);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
