import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token && !email) {
    return NextResponse.redirect(
      new URL("/unsubscribe?status=error", req.nextUrl.origin)
    );
  }

  // Validate email if provided
  if (email && !isValidEmail(email)) {
    return NextResponse.redirect(
      new URL("/unsubscribe?status=error", req.nextUrl.origin)
    );
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("email_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("status", "active");

    if (token) {
      // Validate token format (hex string)
      if (!/^[a-f0-9]{48}$/.test(token)) {
        return NextResponse.redirect(
          new URL("/unsubscribe?status=error", req.nextUrl.origin)
        );
      }
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
  } catch {
    return NextResponse.redirect(
      new URL("/unsubscribe?status=error", req.nextUrl.origin)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("email_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", trimmedEmail)
      .eq("status", "active");

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
