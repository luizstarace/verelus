import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token && !email) {
    return NextResponse.json({ error: "Token or email required" }, { status: 400 });
  }

  try {
    let query = supabase
      .from("email_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("status", "active");

    if (token) {
      query = query.eq("unsubscribe_token", token);
    } else if (email) {
      query = query.eq("email", email.toLowerCase().trim());
    }

    const { error } = await query;

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.redirect(
        new URL("/unsubscribe?status=error", req.nextUrl.origin)
      );
    }

    return NextResponse.redirect(
      new URL("/unsubscribe?status=success", req.nextUrl.origin)
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(
      new URL("/unsubscribe?status=error", req.nextUrl.origin)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("email_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim())
      .eq("status", "active");

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
