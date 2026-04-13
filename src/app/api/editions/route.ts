import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const rawLimit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const rawOffset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  // Clamp values to safe ranges
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100);
  const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

  try {
    const supabase = getSupabase();
    const { data: editions, error, count } = await supabase
      .from("newsletter_editions")
      .select("id, title, subject, status, sent_at, open_rate, click_rate, content_html", { count: "exact" })
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Editions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch editions" }, { status: 500 });
    }

    return NextResponse.json({
      editions: editions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
