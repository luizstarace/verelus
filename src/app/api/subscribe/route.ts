import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function sendWelcomeEmail(name: string, email: string) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TuneSignal by Verelus <newsletter@verelus.com>",
        to: [email],
        subject: "Bem-vindo ao TuneSignal! 🎵",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 30px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5f5f5; font-size: 28px; margin: 0;">Verelus</h1>
              <p style="color: #a3a3a3; font-size: 14px; margin: 4px 0 0;">Music Intelligence Platform</p>
            </div>

            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px; border: 1px solid #262626;">
              <h2 style="color: #f5f5f5; margin: 0 0 16px; font-size: 22px;">Olá, ${name}! 👋</h2>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px;">
                Você agora faz parte da comunidade <strong style="color: #60a5fa;">TuneSignal</strong> — a newsletter semanal de inteligência musical da Verelus.
              </p>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0;">
                Toda <strong>segunda-feira</strong>, você vai receber direto no seu email:
              </p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="font-size: 20px; margin-right: 12px;">📰</span>
                <div>
                  <strong style="color: #f5f5f5;">Top 3 Notícias</strong>
                  <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">As histórias mais importantes da indústria musical</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="font-size: 20px; margin-right: 12px;">🎯</span>
                <div>
                  <strong style="color: #f5f5f5;">Oportunidade de Sync</strong>
                  <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Dicas acionáveis de licenciamento para a semana</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="font-size: 20px; margin-right: 12px;">📊</span>
                <div>
                  <strong style="color: #f5f5f5;">Tendências de Mercado</strong>
                  <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Insights baseados em dados sobre a indústria</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 20px; margin-right: 12px;">🛠️</span>
                <div>
                  <strong style="color: #f5f5f5;">Ferramenta da Semana</strong>
                  <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Recursos curados para músicos independentes</p>
                </div>
              </div>
            </div>

            <div style="background: #171717; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #262626;">
              <p style="color: #d4d4d4; margin: 0 0 12px; font-size: 15px;">
                Sua primeira edição chega na próxima segunda-feira.
              </p>
              <a href="https://verelus.com/archive" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Ver edições anteriores
              </a>
            </div>

            <div style="text-align: center; border-top: 1px solid #262626; padding-top: 20px;">
              <p style="color: #737373; font-size: 13px; margin: 0;">
                TuneSignal é um produto da <strong style="color: #a3a3a3;">Verelus</strong>
              </p>
              <p style="color: #525252; font-size: 12px; margin: 8px 0 0;">
                © 2026 Verelus. Todos os direitos reservados.
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
  try {
    const { name, email } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("email_subscribers")
      .select("id, status")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Re-subscribe
        await supabase
          .from("email_subscribers")
          .update({
            status: "active",
            full_name: name.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        // Send welcome back email
        await sendWelcomeEmail(name.trim(), email.toLowerCase().trim());

        return NextResponse.json({ success: true, resubscribed: true });
      }
      // Already active
      return NextResponse.json({ success: true, already: true });
    }

    // New subscriber
    const { error } = await supabase.from("email_subscribers").insert({
      email: email.toLowerCase().trim(),
      full_name: name.trim(),
      status: "active",
      source: "landing_page",
    });

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    // Send welcome email
    await sendWelcomeEmail(name.trim(), email.toLowerCase().trim());

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
