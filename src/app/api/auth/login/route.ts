import { NextRequest, NextResponse } from "next/server";
import { validateAccess } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const access = await validateAccess(email);

    if (!access.valid || !access.subscription) {
      return NextResponse.json(
        {
          error: "no_subscription",
          message: "Nenhuma assinatura ativa encontrada para este email. Adquira seu plano em nossa página.",
        },
        { status: 403 }
      );
    }

    // Generate a simple session token (for MVP — upgrade to JWT later)
    const token = Buffer.from(
      JSON.stringify({
        userId: access.user.id,
        email: access.user.email,
        tier: access.tier,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
    ).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: access.user.id,
        email: access.user.email,
        name: access.user.full_name,
        tier: access.tier,
        product: access.subscription.product,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
